import { CommandArgs, CommandResult, executeCommand, getCommand } from "../app.js";
import { chatWithAI, createChatMessage } from "../chat.js";
import { CommandRegistry } from "../commands/registry.js";
import { Config } from "../config/index.js";
import { AIConfig } from "../config/ai.config.js";
import { Memory } from "../memory/base.js";
import { Message, Model, OpenAI } from "../openai.js";
import ajv from 'ajv';
import readline from 'readline/promises';
import { Workspace } from "../workspace.js";
import { callAIFunction, createChatCompletion } from "../llm.utils.js";
import { JSON_SCHEMA } from "../prompts/generator.js";
import { FULL_MESSAGE_HISTORY_FILE_NAME, LogCycleHandler } from "../logcycle/logcycle.js";
import { Color, Logger, printAssistantThoughts } from "../logs.js";
import { Spinner } from "../log/spinner.js";
import _ from 'lodash';
import { tryParse } from "../json-utils/index.js";
import schema from "weaviate-ts-client/types/schema/index.js";
import { cleanInput } from "../utils.js";
import { countStringTokens } from "../token-counter.js";

const validate = (new ajv.default()).compile({
  "type": "object",
  "properties": {
      "thoughts": {
          "type": "object",
          "properties": {
              "text": {"type": "string"},
              "reasoning": {"type": "string"},
              "progress": {"type": "string"},
              "plan": {"type": "string"},
              "criticism": {"type": "string"}
          },
          "required": ["text", "reasoning", "plan", "criticism", "progress"],
          "additionalProperties": false
      },
      "command": {
          "type": "object",
          "properties": {
              "name": {"type": "string"},
              "args": {
                  "type": "object"
              }
          },
          "required": ["name", "args"],
          "additionalProperties": false
      }
  },
  "required": ["thoughts", "command"],
  "additionalProperties": false
});

interface AgentOptions {
  fullMessageHistory: Message[];
  nextActionCount: number;
  commandRegistry: CommandRegistry;
  config: AIConfig;
  systemPrompt: string;
  triggeringPrompt: string;
  workspaceDirectory: string;
}

export class Agent {

  public aiName: string;
  public fullMessageHistory: Message[];
  public nextActionCount: number;
  public commandRegistry: CommandRegistry;
  public config: AIConfig;
  public systemPrompt: string;
  public triggeringPrompt: string;
  public workspace: Workspace;
  public userInput: string | undefined = undefined;

  public lastMemoryIndex: number = 0;
  public summaryMemory: Message = {
    role: 'system',
    content: 'I was created',
  };
  public createdAt = new Date();
  public cycleCount: number = 0;
  public logCycleHandler = new LogCycleHandler();

  public constructor (opts: AgentOptions) {
    this.aiName = opts.config.aiName;
    this.fullMessageHistory = opts.fullMessageHistory;
    this.nextActionCount = opts.nextActionCount;
    this.commandRegistry = opts.commandRegistry;
    this.config = opts.config;
    this.systemPrompt = opts.systemPrompt;
    this.triggeringPrompt = opts.triggeringPrompt;
    this.workspace = new Workspace(opts.workspaceDirectory, Config.restrictToWorkspace);
  }

  private _resolvePathlikeCommandArgs (command: CommandResult) {
    if (['', '/'].includes(command.args.get('directory'))) {
      command.args.set('directory', this.workspace.root);
    }
    else {
      ['fileName', 'directory', 'clonePath'].forEach((pathLike) => {
        if (command.args.get(pathLike)) {
          command.args.set(pathLike, this.workspace.getPath(command.args.get(pathLike)));
        }
      });
    }
    return command;
  }

  public async startInteractionLoop() {
    this.cycleCount = 0;
    let userInput: string = '';
    let command = new CommandResult();
    // let commandName: string = '';
    // let args: CommandArgs = new CommandArgs();

    while (true) {
      this.cycleCount += 1;
      this.logCycleHandler.logCountWithinCycle = 0;
      this.logCycleHandler.logCycle(this.config.aiName, this.createdAt, this.cycleCount, this.fullMessageHistory, FULL_MESSAGE_HISTORY_FILE_NAME);

      if (Config.continuousMode && Config.continuousLimit > 0 && this.cycleCount > Config.continuousLimit) {
        Logger.type('Continous limit reached', Color.yellow, Config.continuousLimit);
        break;
      }

      const assistantReply = await Spinner.while(chatWithAI(this, this.systemPrompt, this.triggeringPrompt, this.fullMessageHistory, Config.fastTokenLimit), 'Thinking...');

      let json = await fixJsonUsingMultipleTechniques(assistantReply);
      if (!_.isEmpty(json)) {
        json = validateJSON(json);
        try {
          printAssistantThoughts(this.aiName, json);
          command = getCommand(json);
          // commandName = commandResult.commandName;
          // args = commandResult.args;
          this._resolvePathlikeCommandArgs(command);
        }
        catch (err: unknown) {
          console.error(err);
          Logger.error(JSON.stringify(err), 'Error: \n');
        }
      } 

      if (!Config.continuousMode && this.nextActionCount === 0) {
        this.userInput = '';
        Logger.type('NEXT ACTION', Color.cyan, `COMMAND = ${Color.cyan}${command.name}${Color.reset}  ARGUMENTS = ${Color.cyan}${command.args.toString()}${Color.reset}`);
        Logger.info(`Enter ${Config.authorizeKey} to authorise command, '${Config.authorizeKey} -N' to run N continuous commands, '${Config.exitKey}' to exit program, or enter feedback for ${this.aiName}...`);
        while (true) {
          const input = await cleanInput('Input:', Color.magenta);
          if (input.toLowerCase().trim() === Config.authorizeKey) {
            userInput = 'GENERATE NEXT COMMAND JSON';
            break;
          }
          else if (input.toLowerCase().trim() === 's') {
            Logger.type('-=-=-=-=-=-=-= THOUGHTS, REASONING, PLAN AND CRITICISM WILL NOW BE VERIFIED BY AGENT -=-=-=-=-=-=-=', Color.green);
            const thoughts = json.thoughts ?? {};
            const selfFeedbackResponse = await this.getSelfFeedback(thoughts, Config.fastLLMModel);
            Logger.type(`SELF FEEDBACK: ${selfFeedbackResponse}`, Color.yellow);
            if (selfFeedbackResponse[0].toLowerCase().trim() === Config.authorizeKey) {
              userInput = 'GENERATE NEXT COMMAND JSON';
            }
            else {
              userInput = selfFeedbackResponse;
            }
            break;
          }
          else if (input.toLowerCase().trim() === '') {
            Logger.warn('Invalid input format.');
            continue;
          }
          else if (input.toLowerCase().startsWith(`${Config.authorizeKey} -`)) {
            try {
              this.nextActionCount = Math.abs(parseInt(input.split(' ')[1], 10));
              userInput = 'GENERATE NEXT COMMAND JSON';
            }
            catch (err: any) {
              Logger.warn(`Invalid input format. Please enter '${Config.authorizeKey} -n' where n is the number of continuous tasks.`);
              continue;
            }
            break;
          }
          else if (input.toLowerCase().trim() === Config.exitKey) {
            userInput = 'EXIT';
            break;
          }
          else {
            userInput = input;
            command.name = 'humanFeedback';
            break;
          }
        }
        if (userInput === 'GENERATE NEXT COMMAND JSON') {
          Logger.type('-=-=-=-=-=-=-= COMMAND AUTHORISED BY USER -=-=-=-=-=-=-=', Color.magenta);
        }
        else if (userInput === 'EXIT') {
          Logger.info('Exiting....');
          break;
        }
      }
      else {
        Logger.type('NEXT ACTION', Color.cyan, `COMMAND = ${Color.cyan}${command.name}${Color.reset}  ARGUMENTS = ${Color.cyan}${command.args.toString()}${Color.reset}`);
      }

      let result: string;
      if (command.name.toLowerCase().startsWith('error')) {
        result = `Command ${command.name} threw the following error: ${command.args.toString()}`;
      }
      else if (command.name === 'humanFeedback') {
        result = `Human feedback: ${userInput}`;
      }
      else {
        const commandResult = await executeCommand(this.commandRegistry, command, this.config.promptGenerator);
        result = `Command ${command.name} returned: ${commandResult}`;

        const resultTokenLength = await countStringTokens(commandResult, Config.fastLLMModel);
        const memoryTokenLength = await countStringTokens(this.summaryMemory.content, Config.fastLLMModel);

        if (resultTokenLength + memoryTokenLength + 600 > Config.fastTokenLimit) {
          result = `Failure: command ${command.name} returned too much output. Do not execute this command again with the same arguments.`;
        }

        if (this.nextActionCount > 0) {
          this.nextActionCount -= 1;
        }
      }

      if (result) {
        this.fullMessageHistory.push(createChatMessage('system', result));
        Logger.type('SYSTEM: ', Color.yellow, result);
      }
      else {
        this.fullMessageHistory.push(createChatMessage('system', 'Unable to execute command'));
        Logger.type('SYSTEM: ', Color.yellow, 'Unable to execute command');
      }
    }
  }

  private async getSelfFeedback (thoughts: any, model: Model) {
    const role = this.config.role;
    const feedbackPrompt = `Below is a message from an AI agent with the role of ${role}. Please review the provided Thought, Reasoning, Plan, Progress and Criticism. If these elements accurately contribute to the successful execution of the assumed role, respond with the letter 'Y' followed by a space, and then explain why it is effective. If the provided information is not suitable for achieving the role's objectives, please provide one or more sentences addressing the issue and suggesting a resolution.`
    const reasoning = thoughts.reasoning ?? '';
    const plan = thoughts.plan ?? '';
    const thought = thoughts.thoughts ?? '';
    const criticism = thoughts.criticism ?? '';
    const feedbackThoughts = thought + reasoning + plan + criticism;
    const messages: Message[] = [
      {
        role: 'user',
        content: feedbackPrompt + feedbackThoughts,
      }
    ];
    return await createChatCompletion(messages, model);
  }
}

/**
 * Fix the given JSON string to make it parseable and fully compliant with two techniques.
 */
export async function fixJsonUsingMultipleTechniques (jsonString: string) {
  jsonString = jsonString.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  }
  if (jsonString.endsWith('```')) {
    jsonString.substring(0, jsonString.length - 3);
  }

  try {
    return JSON.parse(jsonString);
  }
  catch {}

  if (jsonString.startsWith('json ')) {
    jsonString = jsonString.slice(5);
    jsonString = jsonString.trim();
  }

  try {
    return JSON.parse(jsonString);
  }
  catch {}

  let json = await fixAndParseJson(jsonString);
  Logger.debug(`Assistant reply JSON: ${JSON.stringify(json)}`);

  if (!_.isEmpty(json)) {
    return json;
  }

  Logger.error(jsonString, 'Error: The following AI output couldn\'t be parsed as JSON:\n');

  return {};
}

/**
 * Fix and parse JSON string
 */
export async function fixAndParseJson (jsonString: string, tryToFixWithGpt: boolean = true) {
  try {
    // Escaping newlines in the string field values
    const regex = /"(?:[^"\\]|\\[^n])*?"/g;
    const escapedString = jsonString.replace(regex, (match) =>
      match.replace(/\n/g, "\\\\n")
    );
    return JSON.parse(escapedString);
  }
  catch { }

  try {
    return tryParse(jsonString);
  }
  catch { }

  try {
    const braceIndex = jsonString.indexOf('{');
    let maybeFixedJson = jsonString.slice(braceIndex);
    const lastBraceIndex = maybeFixedJson.lastIndexOf('}');
    maybeFixedJson = maybeFixedJson.substring(0, lastBraceIndex + 1);
    return JSON.parse(maybeFixedJson);
  }
  catch (err) {
    return tryAIFix(tryToFixWithGpt, err, jsonString);
  }
}

async function tryAIFix(
  tryToFixWithGpt: boolean,
  err: any,
  jsonString: string
) {
  if (!tryToFixWithGpt) {
    throw err;
  }
  if (Config.debugMode) {
    Logger.warn(`Warning: Failed to parse AI output, attempting to fix.
If you see this warning frequently, it's likely that your prompt is confusing the AI. Try changing it up slightly.`);
  }

  const aiFixedJson = await autoFixJson(jsonString, JSON_SCHEMA);

  if (aiFixedJson !== 'failed') {
    return JSON.parse(aiFixedJson);
  }

  return {};
}

/**
 * Fix the given JSON string to make it parseable and fully compliant with the provided schema using GPT-3
 */
async function autoFixJson (jsonString: string, schema: string) {
  const functionString =
    "function fixJson(jsonString: string, schema:string): string;";
  const args = [jsonString, schema];
  const description = `Fixes the provided JSON string to make it parseable and fully complient with the provided schema.
If an object or field specifed in the schema isn't contained within the correct JSON, it is ommited.
The function also escapes any double quotes within JSON string values to ensure that they are valid.
If the JSON string contains any NaN values, they are replaced with null before being parsed.
This function is brilliant at guessing when the format is incorrect.`;

  // if (jsonString[0] !== "`") {
  //   jsonString = "```json\n" + jsonString + "\n```";
  // }
  const resultString = await callAIFunction(
    functionString,
    args,
    description,
    Config.fastLLMModel);
    
  Logger.debug('------------ JSON FIX ATTEMPT ---------------');
  Logger.debug(`Original JSON: ${jsonString}`);
  Logger.debug('-----------');
  Logger.debug(`Fixed JSON: ${resultString}`);
  Logger.debug('----------- END OF FIX ATTEMPT ----------------');

  try {
    JSON.parse(resultString);
    return resultString;
  }
  catch {
    return 'failed';
  }
}


function validateJSON (json: any) {
  const valid = validate(json);
  if (!valid) {
    Logger.error('The JSON object is invalid');
    if (Config.debugMode && validate.errors) {
      Logger.error('The following errors were found:');
      for (const err of validate.errors) {
        if (err.message) {
          Logger.error(`Error: ${err.message}`);
        }
      }
    }
  }
  else {
    Logger.debug('The JSON object is valid');
  }
  return json;
}
