import { PromptGenerator, ResponseJSONFormat } from "./prompts/generator.js";
import { CommandRegistry } from "./commands/registry.js";
import { Memory } from "./memory/base.js";
import { Logger } from "./logs.js";

export class CommandArgs {
  private _args: Record<string, any>;
  
  public constructor (args: Record<string, any> = {}) {
    this._args = args;
  }

  public toString() {
    return Object.entries(this._args).map(([ key, value ]) => `${key} = ${value}`).join(',');
  }

  public get (key: string) {
    return this._args[key];
  }

  public toArray() {
    return Object.values(this._args);
  }

  public set (key: string, value: any) {
    this._args[key] = value;
  }
}
export class CommandResult {
  public args: CommandArgs;
  public constructor (public name: string = '', args: Record<string, any> = {}) {
    this.args = new CommandArgs(args);
  }
}

export function getCommand (json: ResponseJSONFormat) {
  return new CommandResult(json.command.name, json.command.args ?? {});
}

/**
 * Takes the original command name given by the AI, and checks if the
    string matches a list of common/known hallucinations
 */
function mapCommandSynonyms (commandName: string) {
  const synonyms = [
    [ 'appendToFile', 'appendFile' ],
    [ 'createFile', 'writeFile' ],
    [ 'searchDirectory', 'searchFiles' ],
    [ 'search', 'google' ],
    [ 'searchGoogle', 'google' ],
    [ 'googleSearch', 'google' ],
  ];

  for (const [ seenCommand, actualCommandName ] of synonyms) {
    if (commandName.toLowerCase() === seenCommand.toLowerCase()) {
      return actualCommandName;
    }
  }
  return commandName;
}

export async function executeCommand (commandRegistry: CommandRegistry, commandResult: CommandResult, prompt: PromptGenerator ) {
  try {
    const command = commandRegistry.getCommand(commandResult.name);
    console.log('command found: ', command);
    if (command) {
      return await command.call(...commandResult.args.toArray());
    }
    commandResult.name = mapCommandSynonyms(commandResult.name.toLowerCase());
    if (commandResult.name === 'memoryAdd') {
      return Memory.add(commandResult.args.get('string'));
    }
    else if (commandResult.name === 'taskComplete') {
      await shutdown(0);
    }
    else {
      for (const command of prompt.commands) {
        if (commandResult.name === command.name.toLowerCase() || commandResult.name === command.description.toLowerCase()) {
          return await command.call(...commandResult.args.toArray());
        }
      }
      return `Unknown command '${commandResult.name}'. Please refer to the 'COMMANDS' list for available commands and only respond in the specified JSON format.`;
    }
  }
  catch (err: any) {
    return `Error ${err.message}`;
  }
}

export async function shutdown(value: number): Promise<void>;
export async function shutdown(value: () => void): Promise<void>;
export async function shutdown(value: number | (() => void)): Promise<void> {
  Logger.info('Shutting down...');
  await Logger.shutdown();
  await Memory.shutdown();
  
  if (typeof value === 'number') {
    process.exit(value);
  }
  else {
    value();
  }
}
