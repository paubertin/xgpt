enum LogType {
  DEBUG = 'DEBUG',
  TRACE = 'TRACE',
  INFO = 'INFO',
  STATUS = 'STATUS',
  ERROR = 'ERROR'
}

export enum Colour {
  red = '\x1B[31m',
  yellow = '\x1B[33m',
  green = '\x1B[32m',
  black = '\x1B[39m'
}

export class Logger {

  private static loggerName = 'x-gpt';

  public static write (type: LogType, ...args: any[]) {
    let colour = Colour.black;
    const now = new Date();
    const dateStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    switch (type) {
      case LogType.DEBUG:
        colour = Colour.black;
        args = args.map((a) => colour + a);
        console.log(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
      case LogType.INFO:
        colour = Colour.yellow;
        args = args.map((a) => colour + a);
        console.info(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
      case LogType.TRACE:
        colour = Colour.yellow;
        args = args.map((a) => colour + a);
        console.trace(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
      case LogType.STATUS:
        colour = Colour.green;
        args = args.map((a) => colour + a);
        console.info(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
      case LogType.ERROR:
        colour = Colour.red;
        args = args.map((a) => colour + a);
        console.error(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
    }
  }

  public static log (...args: any[]) {
    return this.write(LogType.DEBUG, ...args);
  }

  public static info (...args: any[]) {
    return this.write(LogType.INFO, ...args);
  }

  public static trace (...args: any[]) {
    return this.write(LogType.TRACE, ...args);
  }

  public static status (...args: any[]) {
    return this.write(LogType.STATUS, ...args);
  }

  public static error (...args: any[]) {
    return this.write(LogType.ERROR, ...args);
  }
}