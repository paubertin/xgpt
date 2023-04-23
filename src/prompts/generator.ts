import { Command } from "../commands/command";
import { CommandRegistry } from "../commands/registry";

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
      + 'You should only respond in JSON format matching the JSON schema described below: \nResponse Format:\n'
      + `\`\`\` {
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
      }\`\`\``
      /*
      + '{\n'
      + '\tthoughts: {'
      + '\t\ttext: \'thought\','
      + '\t\treasoning: \'reasoning\','
      + '\t\tplan: \'- short bulleted\n- list that conveys\n- long-term plan\','
      + '\t\tcriticism: \'constructive self-criticism\','
      + '\t\tspeak: \'thoughts summary to say to user\''
      + '\t},'
      + '\tcommand: {'
      + '\t\tname: \'command name\','
      + '\t\targs: {'
      + '\t\t\targName: \'value\''
      + '\t\t}'
      + '\t}'
      + '}\n\n'
      */
     + '\n\n'
      + 'Ensure the response can be parsed by JSON.parse method.';
  }

}