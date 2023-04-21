interface ResponseFormat {
  thoughts: {
    text: string;
    reasoning: string;
    plan: string;
    criticism: string;
    speak: string;
  };
  command: {
    name: string;
    args: {
      argName: string;
    };
  };
}

type CommandFn = (...fnArgs: any[]) => any;

export interface Command {
  label: string;
  name: string;
  function?: CommandFn;
  args?: any[];
};

export class PromptGenerator {
  private constraints: string[] = [];
  private commands: Command[] = [];
  private resources: string[] = [];
  private performanceEvaluation: string[] = [];
  private goals: string[] = [];
  private commandRegistry: any = undefined;
  private name: string = 'Bob';
  private role: string = 'AI';
  private responseFormat: ResponseFormat = {
    thoughts: {
      text: 'thought',
      reasoning: 'reasoning',
      plan: '- short bulleted\n- list that conveys\n- long-term plan',
      criticism: 'constructive self-criticism',
      speak: 'thoughts summary to say to user',
    },
    command: {
      name: 'command name',
      args: {
        argName: 'value',
      },
    },
  };

  /**
   * Add a constraint to the constraints list
   */
  public addConstraint (constraint: string) {
    this.constraints.push(constraint);
  }

  /**
   * Add a command to the commands list with a label, name, and optional arguments.
   */
  public addCommand (label: string, name: string, args?: any[], fn?: ((...fnArgs: any[]) => any)) {
    const command: Command = {
      label,
      name,
      args,
      function: fn,
    };

    this.commands.push(command);
  }

  /**
   * Generate a formatted string representation of a command.
   */
  public generateCommandString (command: Command) {
    const args = command.args ?? [];
    const argsString = args.map((value, index) => `"${index}": "${value}"`).join(', ');
    return `${command.label}: "${command.name}", args: ${argsString}`;
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
      let commandStrings: string[] = [];
      if (this.commandRegistry) {
        for (const item of this.commandRegistry.commandsValues()) {
          if (item.enabled) {
            commandStrings.push(item.toString());
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
      + `${this.generateNumberedList(this.performanceEvaluation)}\n\n`;
  }

}