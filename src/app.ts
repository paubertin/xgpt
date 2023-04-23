import { NotImplementedError } from "@d4c/numjs/build/main/lib/errors";
import { PromptGenerator, ResponseJSONFormat } from "./prompts/generator";
import { CommandRegistry } from "./commands/registry";

export function getCommand (json: ResponseJSONFormat) {
  return {
    commandName: json.command.name,
    args: json.command.args ?? {},
  }
}

export async function executeCommand (commandRegistry: CommandRegistry, commandName: string, args: Record<string, any>, prompt: PromptGenerator ) {
  try {
    const command = commandRegistry.getCommand(commandName);

    if (command) {
      return await command.call(...Object.values(args));
    }
  }
  catch (err: any) {
    console.error(err);
    return `Erroe ${err}`;
  }
}