export class ValueError extends Error {
  public constructor (message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ConfigError extends Error {
  public constructor (message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotImplementedError extends Error {
  public constructor (message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}