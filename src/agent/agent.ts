import { executeCommand, getCommand } from "../app";
import { chatWithAI, createChatMessage } from "../chat";
import { CommandRegistry } from "../commands/registry";
import { Config } from "../config";
import { AIConfig } from "../config/ai.config";
import { printAssistantThoughts } from "../logs";
import { Memory } from "../memory/base";
import { Message } from "../openai";
import ajv from 'ajv';
import Joi from 'joi';
import readline from 'readline/promises';
import { Workspace } from "../workspace";
import { Colour } from "../logger";
import { callAIFunction } from "../llm.utils";
import { JSON_SCHEMA } from "../prompts/generator";

const schema = (new ajv()).compile({
  "type": "object",
  "properties": {
      "thoughts": {
          "type": "object",
          "properties": {
              "text": {"type": "string"},
              "reasoning": {"type": "string"},
              "plan": {"type": "string"},
              "criticism": {"type": "string"},
              "speak": {"type": "string"}
          },
          "required": ["text", "reasoning", "plan", "criticism", "speak"],
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
  aiName: string;
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

  public constructor (opts: AgentOptions) {
    this.aiName = opts.aiName;
    this.fullMessageHistory = opts.fullMessageHistory;
    this.nextActionCount = opts.nextActionCount;
    this.commandRegistry = opts.commandRegistry;
    this.config = opts.config;
    this.systemPrompt = opts.systemPrompt;
    this.triggeringPrompt = opts.triggeringPrompt;
    this.workspace = new Workspace(opts.workspaceDirectory, Config.restrictToWorkspace);
  }

  private _resolvePathlikeCommandArgs (commandArgs: Record<string, any>) {
    if ('directory' in commandArgs && ['', '/'].includes(commandArgs.directory)) {
      commandArgs.directory = this.workspace.root;
    }
    else {
      ['fileName', 'directory', 'clonePath'].forEach((pathLike) => {
        if (pathLike in commandArgs) {
          commandArgs[pathLike] = this.workspace.getPath(commandArgs[pathLike]);
        }
      });
    }
    return commandArgs;
  }

  public async startInteractionLoop() {
    let loopCount = 0;
    let userInput: string = '';

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
      loopCount += 1;

      if (Config.continuousMode && Config.continuousLimit > 0 && loopCount > Config.continuousLimit) {
        console.error('Continuous limit reached');
        break;
      }

      const assistantReply = await chatWithAI(this.systemPrompt, this.triggeringPrompt, this.fullMessageHistory, Config.fastTokenLimit);
      // console.log('assistantReply', assistantReply);
      if (!assistantReply) {
        console.log('no reply...');
        break;
      }
      let json: any;
      try {
        json = await fixAndParseJson(assistantReply, true);
      }
      catch (err: any) {
        console.error('JSON parse failed...', assistantReply);
        break;
      }
      const validated = schema(json);
      if (!validated) {
        console.log('unvalid json', json);
        // break;
      }
      printAssistantThoughts(this.aiName, json);
      let { commandName, args } = getCommand(json);
      args = this._resolvePathlikeCommandArgs(args);

      if (!Config.continuousMode && this.nextActionCount === 0) {
        console.log(`NEXT ACTION: COMMAND = ${commandName}  ARGUMENTS = ${JSON.stringify(args)}`);
        console.log(`Enter 'y' to authorise command, 'y -N' to run N continuous commands, 'n' to exit program, or enter feedback for ${this.aiName}...`);
        while (true) {
          const input = await rl.question('Input:');
          if (input.toLowerCase().trim() === 'y') {
            userInput = 'GENERATE NEXT COMMAND JSON';
            break;
          }
          else if (input.toLowerCase().trim() === '') {
            console.log('Invalid input format...');
            continue;
          }
          else if (input.toLowerCase().startsWith('y -')) {
            try {
              this.nextActionCount = Math.abs(parseInt(input.split(' ')[1], 10));
              userInput = 'GENERATE NEXT COMMAND JSON';
            }
            catch (err: any) {
              console.error('Invalid input format. Please enter \'y -n\' where n is the number of continuous tasks.');
              continue;
            }
            break;
          }
          else if (input.toLowerCase().trim() === 'n') {
            userInput = 'EXIT';
            break;
          }
          else {
            userInput = input;
            commandName = 'humanFeedback';
            break;
          }
        }
        if (userInput === 'GENERATE NEXT COMMAND JSON') {
          console.log('-=-=-=-=-=-=-= COMMAND AUTHORISED BY USER -=-=-=-=-=-=-=');
        }
        else if (userInput === 'EXIT') {
          console.log('Exiting....');
          break;
        }
      }
      else {
        console.log(`NEXT ACTION: COMMAND = ${commandName}  ARGUMENTS = ${JSON.stringify(args)}`);
      }

      let result;
      if (commandName && commandName.toLowerCase().startsWith('error')) {
        result = `Command ${commandName} threw the following error: ${JSON.stringify(args)}`;
      }
      else if (commandName === 'humanFeedback') {
        result = `Human feedback: ${userInput}`;
      }
      else {
        for (const plugin of Config.plugins) {
          if (!plugin.canHandlePreCommand()) {
            continue;
          }
          const pluginResult = plugin.preCommand(commandName, args);
          commandName = pluginResult.commandName;
          args = pluginResult.args;
        }
        const commandResult = await executeCommand(this.commandRegistry, commandName, args, this.config.promptGenerator);

        result = `Command ${commandName} returned: ${commandResult}`;

        for (const plugin of Config.plugins) {
          if (!plugin.canHandlePostCommand()) {
            continue;
          }
          result = plugin.postCommand(commandName, result);
        }

        if (this.nextActionCount > 0) {
          this.nextActionCount -= 1;
        }
      }

      if (commandName !== 'doNothing') {
        Memory.add(`Assistant reply: ${assistantReply}\nResult: ${result}\nHuman feedback: ${userInput}`);

        if (result) {
          this.fullMessageHistory.push(createChatMessage('system', result));
          console.log('SYSTEM: ', result);
        }
        else {
          this.fullMessageHistory.push(createChatMessage('system', 'Unable to execute command'));
          console.log('SYSTEM: ', 'Unable to execute command');
        }
      }
    }
  }
}

async function fixAndParseJson (jsonString: string, tryToFixWithGpt: boolean = true) {
  try {
    return JSON.parse(jsonString.replaceAll('\n', '\\n'));
  }
  catch (err: any) {
    console.error('\nFailed to parse JSON, trying multiple techniques...', jsonString);
    console.error('\n');
    try {
      // Escaping newlines in the string field values
      const regex = /"(?:[^"\\]|\\[^n])*?"/g;
      const escapedString = jsonString.replace(regex, (match) =>
        match.replace(/\n/g, "\\\\n")
      );
      return JSON.parse(escapedString);
    }
    catch (err: any) {
      try {
        const braceIndex = jsonString.indexOf("{");
        jsonString = jsonString.slice(braceIndex);
        const lastBraceIndex = jsonString.lastIndexOf("}");
        jsonString = jsonString.slice(0, lastBraceIndex + 1);
        return JSON.parse(jsonString);
      }
      catch (err: any) {
        if (tryToFixWithGpt) {
          console.warn(
            "Warning: Failed to parse AI output, attempting to fix.\n If you see this warning frequently, it's likely that your prompt is confusing the AI. Try changing it up slightly."
          );
          const aiFixedJson = await fixJson(jsonString, JSON_SCHEMA, false);
          if (aiFixedJson !== "failed") {
            return JSON.parse(aiFixedJson);
          }
          else {
            console.error("Failed to fix ai output, telling the AI.");
            return jsonString;
          }
        }
        else {
          throw err;
        }
      }
    }
  }
}

async function fixJson(
  jsonString: string,
  schema: string,
  debug = false
): Promise<string | "failed"> {
  const functionString =
    "function fixJson(jsonString: string, schema:string): string {";
  const args = [jsonString, schema];
  const description = `Fixes the provided JSON string to make it parseable and fully complient with the provided schema.
If an object or field specifed in the schema isn't contained within the correct JSON, it is ommited.
This function is brilliant at guessing when the format is incorrect.`;

  if (jsonString[0] !== "`") {
    jsonString = "```json\n" + jsonString + "\n```";
  }
  const resultString = await callAIFunction(
    functionString,
    args,
    description,
    Config.smartLLMModel);
  if (debug) {
    console.debug("------------ JSON FIX ATTEMPT ---------------");
    console.debug(`Original JSON: ${jsonString}`);
    console.debug("-----------");
    console.debug(`Fixed JSON: ${resultString}`);
    console.debug("----------- END OF FIX ATTEMPT ----------------");
  }
  try {
    JSON.parse(resultString);
    return resultString;
  }
  catch {
    return "failed";
  }
}
