export class Command {
  public constructor (
    public name: string,
    public description: string,
    public method: (...args: any[]) => any = () => {},
    public args: Record<string, any> = {},
    public enabled: boolean = true,
    public disabledReason?: string,
  ) {}

  public call (...args: any[]) {
    if (!this.enabled) {
      return `Command ${this.name} is disabled: ${this.disabledReason}`;
    }
    return this.method(...args);
  }
}

export function command (fun: ((...args: any[]) => any), opts: {
  name: string;
  description: string;
  args: Record<string, any>;
  enabled?: boolean;
  disableReason?: string;
}) {
  return new Command(opts.name, opts.description, fun, opts.args, opts.enabled, opts.disableReason);
  /*
  return (_target: any, _propertyKey: any, descriptor: PropertyDescriptor) => {
    // descriptor.value is the original function
    const wrapper = descriptor.value; // save in aux
    
    const command = new Command(opts.name, opts.description, wrapper, opts.signature ?? wrapper.toString(), opts.enabled ?? true, opts.disableReason);
  
    // replace the value with another function
    // If you use `descriptor.value = () => {}` instead of function,
    //   you cannot access the `arguments`
    descriptor.value = function () {
      return wrapper.apply(this, arguments);
    };

    descriptor.value.command = command;

    return descriptor.value;
  };
  */
}