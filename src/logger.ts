import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { Config } from './config';
import { exists } from './utils';
import { sleepAsync } from './sleep';

enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export enum Colour {
  red = '\x1B[31m',
  yellow = '\x1B[33m',
  green = '\x1B[32m',
  black = '\x1B[39m'
}

const ResetColor = '\x1B[0m';

export class Logger {

  private static logFileName: string = 'activity.log';
  private static errorFileName: string = 'error.log';

  public static async init () {
    if (this._initialized) {
      return;
    }

    const logDir = Config.logsDirectory
      ? (path.isAbsolute(Config.logsDirectory)
        ? Config.logsDirectory
        : path.join(process.cwd(), Config.logsDirectory))
      : path.join(process.cwd(), 'logs');
    if (!exists(logDir)) {
      await fs.promises.mkdir(logDir, { recursive: true });
    }

    this._instance = new Logger(logDir);
    this._instance._init();
    this._initialized = true;
    return this._instance;
  }

  private _init () {
  }

  public static get instance () {
    if (!this._instance) {
      throw new Error('Logger not initialized');
    }
    return this._instance;
  }

  private constructor (logDir: string) {
    this.typingLogger = winston.createLogger({
      level: LogLevel.DEBUG,
      transports: [
        new winston.transports.Console({ level: LogLevel.INFO, format: winston.format.printf(({ title, titleColor, level, message }) => {
          const titleString = title
            ? titleColor
              ? `${titleColor}${title}${ResetColor}`
              : title
            : '';
          if (titleString) {
            process.stdout.write(titleString + ' ');
          }
          while (message.length > 0) {
            process.stdout.write(message[0]);
            message = message.slice(1);

            const delay = 10 + (1 - Math.random()) * 50;
            const until = (new Date(new Date().getTime() + delay )).getTime();
            while (Date.now() < until) {}
          }
          return '';
        }) }),
        new winston.transports.File({ filename: path.join(logDir, Logger.logFileName), level: LogLevel.DEBUG, format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, title }) => {
            return `${timestamp} [${level.toUpperCase()}] ${title} ${message}`;
          }),
        ) }),
        new winston.transports.File({ filename: path.join(logDir, Logger.errorFileName), level: LogLevel.ERROR, format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, title }) => {
            return `${timestamp} [${level.toUpperCase()}] ${title} ${message}`;
          }),
        ) }),
      ],
    });

    this.logger = winston.createLogger({
      level: LogLevel.DEBUG,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logDir, Logger.logFileName), level: LogLevel.DEBUG, format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, title }) => {
            return `${timestamp} [${level.toUpperCase()}] ${title} ${message}`;
          }),
        ) }),
        new winston.transports.File({ filename: path.join(logDir, Logger.errorFileName), level: LogLevel.ERROR, format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, title }) => {
            return `${timestamp} [${level.toUpperCase()}] ${title} ${message}`;
          }),
        ) }),
      ],
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.printf(({ title, titleColor, level, message }) => {
          const titleString = title
            ? titleColor
              ? `${titleColor}${title}${ResetColor}`
              : title
            : '';
          return `${titleString} ${message}`;
        }),
      ),
    });
  }

  private static _log (title: string = '', titleColor: string = '', message: string | string[] = '', level: LogLevel = LogLevel.INFO) {
    if (Array.isArray(message)) {
      message = message.join(' ');
    }
    this.instance.logger.log(level, message, { title, titleColor });
  }

  private static loggerName = 'x-gpt';

  public static write (type: LogLevel, ...args: any[]) {
    let colour = Colour.black;
    const now = new Date();
    const dateStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    switch (type) {
      case LogLevel.DEBUG:
        colour = Colour.black;
        args = args.map((a) => colour + a);
        console.log(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
      case LogLevel.INFO:
        colour = Colour.yellow;
        args = args.map((a) => colour + a);
        console.info(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
      case LogLevel.ERROR:
        colour = Colour.red;
        args = args.map((a) => colour + a);
        console.error(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
        break;
    }
  }

  public static type (message: string | string[], title: string = '', titleColor: string = '', level: LogLevel = LogLevel.INFO) {
    if (Array.isArray(message)) {
      message = message.join(' ');
    }
    this.instance.typingLogger.log(level, message, { title, titleColor });
  }

  public static debug (message: string | string[], title: string = '', titleColor: string = '') {
    this._log(title, titleColor, message, LogLevel.DEBUG);
  }

  public static warn (message: string | string[], title: string = '', titleColor: string = '') {
    this._log(title, titleColor, message, LogLevel.WARN);
  }

  public static error (message: string | string[], title: string = '') {
    this._log(title, Colour.red, message, LogLevel.ERROR);
  }

  private static _instance: Logger | undefined = undefined;
  private static _initialized: boolean = false;

  private typingLogger: winston.Logger;
  private logger: winston.Logger
}