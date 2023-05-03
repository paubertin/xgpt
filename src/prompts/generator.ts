import { Command } from "../commands/command.js";
import { CommandRegistry } from "../commands/registry.js";

export interface ResponseJSONFormat {
  thoughts: {
    text: string;
    reasoning: string;
    plan: string;
    criticism: string;
    speak: string;
  };
  command: {
    name: string;
    args: Record<string, any>;
  };
}

export const JSON_SCHEMA = `
{
  "command": {
      "name": "command name",
      "args":{
          "arg name": "value"
      }
  },
  "thoughts":
  {
      "text": "thought",
      "reasoning": "reasoning",
      "plan": "- short bulleted\n- list that conveys\n- long-term plan",
      "criticism": "constructive self-criticism",
      "speak": "thoughts summary to say to user"
  }
}`;

export class PromptGenerator {
  private constraints: string[] = [];
  private commands: Command[] = [];
  private resources: string[] = [];
  private performanceEvaluation: string[] = [];
  public goals: string[] = [];
  public commandRegistry?: CommandRegistry;
  public name: string = 'Bob';
  public role: string = 'AI';

  /**
   * Add a constraint to the constraints list
   */
  public addConstraint (constraint: string) {
    this.constraints.push(constraint);
  }

  /**
   * Add a command to the commands list with a label, name, and optional arguments.
   */
  public addCommand (command: Command) {
    this.commands.push(command);
  }

  /**
   * Generate a formatted string representation of a command.
   */
  public generateCommandString (command: Command) {
    const args = command.args ?? {};
    const argsString = Object.entries(args).map((value) => `"${value[0]}": "${value[1]}"`).join(', ');
    return `${command.description}: "${command.name}", args: ${argsString}`;
  }

  /**
   * Add a resource to the resources list.
   */
  public addResource (resource: string) {
    this.resources.push(resource);
  }

  /**
   * Add a performance evaluation item to the performance_evaluation list.
  */
  public addPerformanceEvaluation (evaluation: string) {
    this.performanceEvaluation.push(evaluation);
  }

  /**
   * Generate a numbered list from given items based on the item_type.
   */
  public generateNumberedList (items: string[]): string;
  public generateNumberedList (items: string[], itemType: 'list'): string;
  public generateNumberedList (items: Command[], itemType: 'command'): string;
  public generateNumberedList (items: any[], itemType: 'list' | 'command' = 'list') {
    if (itemType === 'command') {
      let commandStrings: any[] = [];
      if (this.commandRegistry) {
        for (const item of this.commandRegistry.commands.values()) {
          if (item.enabled) {
            items.push(item);
          }
        }
      }
      for (const item of items) {
        commandStrings.push(this.generateCommandString(item));
      }
      return commandStrings.reduce((str: string, item, idx: number) => { return str + '\n' + `${idx + 1}. ${item}`; }, '');
    }
    else {
      return items.reduce((str: string, item, idx: number) => { return str + '\n' + `${idx + 1}. ${item}`; }, '');
    }
  }

  /**
   * Generate a prompt string based on the constraints, commands, resources and performance evaluations.
   */
  public generatePromptString () {
    return `Constraints:\n${this.generateNumberedList(this.constraints)}\n\n`
      + 'Commands:\n'
      + `${this.generateNumberedList(this.commands, 'command')}\n\n`
      + `Resources:\n${this.generateNumberedList(this.resources)}\n\n`
      + 'Performance Evaluation:\n'
      + `${this.generateNumberedList(this.performanceEvaluation)}\n\n`
      + 'You should only respond in JSON format as described below without any other commentary.\n\nResponse Format:\n'
      + JSON_SCHEMA
     + '\n\n'
      + 'Ensure the response can be parsed by Javascript JSON.parse method.';
  }

}