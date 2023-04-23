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

export class Agent {

  public constructor (
    public name: string,
    public memory: Memory,
    public fullMessageHistory: Message[],
    public nextActionCount: number,
    public commandRegistry: CommandRegistry,
    public config: AIConfig,
    public systemPrompt: string,
    public triggeringPrompt: string,
  ) {
  }

  public async startInteractionLoop() {
    let loopCount = 0;
    let commandName: string | undefined = undefined;
    let args: any[] | undefined = undefined;
    let userInput: string = '';

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
      loopCount += 1;

      if (Config.continuousMode && Config.continuousLimit > 0 && loopCount > Config.continuousLimit) {
        console.error('Continuous limit reached');
        break;
      }

      const assistantReply = await chatWithAI(this.systemPrompt, this.triggeringPrompt, this.fullMessageHistory, this.memory, Config.fastTokenLimit);
      // console.log('assistantReply', assistantReply);
      if (!assistantReply) {
        console.log('no reply...');
        break;
      }
      let json: any;
      try {
        json = JSON.parse(assistantReply.replaceAll('\n', ''));
      }
      catch (err: any) {
        console.error('JSON parse failed...', assistantReply, typeof assistantReply);
        break;
      }
      const validated = schema(json);
      if (!validated) {
        console.log('unvalid json', json);
        // break;
      }
      printAssistantThoughts(this.name, json);
      let { commandName, args } = getCommand(json);

      if (!Config.continuousMode && this.nextActionCount === 0) {
        console.log(`NEXT ACTION: COMMAND = ${commandName}  ARGUMENTS = ${JSON.stringify(args)}`);
        console.log(`Enter 'y' to authorise command, 'y -N' to run N continuous commands, 'n' to exit program, or enter feedback for ${this.name}...`);
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
            commandName = 'human_feedback';
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
      else if (commandName === 'human_feedback') {
        result = `Human feedback: ${userInput}`;
      }
      else {
        for (const plugin of Config.plugins) {
          if (!plugin.canHandlePreCommand()) {
            continue;
          }
          const p = plugin.preCommand(commandName, args);
          commandName = p.commandName;
          args = p.args;
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

      if (commandName !== 'do_nothing') {
        this.memory.add(`Assistant reply: ${assistantReply}\nResult: ${result}\nHuman feedback: ${userInput}`);

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