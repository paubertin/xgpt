
type CommandFn = (...fnArgs: any[]) => any;

export interface Command {
  label: string;
  name: string;
  function?: CommandFn;
  args?: any[];
};

/*
export class Command {
  public name: string;
  public description: string;
  public method: CommandFn;
}
*/