import { Command } from "./command";

export class CommandRegistry {
  public commands: Map<string, Command> = new Map();

  public register (command: Command) {
    this.commands.set(command.name, command);
  }

  public getCommand (name: string) {
    return this.commands.get(name);
  }

}