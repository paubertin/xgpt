import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { exists } from './utils';
import { sayText } from './speech';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export enum Color {
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

    const logDir = path.join(process.cwd(), 'logs');
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

  public static async shutdown () {
    return await Promise.all([
      this.instance.loggerFinished,
      this.instance.typingLoggerFinished,
    ]);
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

    this.typingLoggerFinished = new Promise((resolve) => this.typingLoggerFinishedResolved = resolve);
    this.loggerFinished = new Promise((resolve) => this.loggerFinishedResolved = resolve);
    this.typingLogger.on('finish', () => {
      this.typingLoggerFinishedResolved?.();
    });
    this.logger.on('finish', () => {
      this.loggerFinishedResolved?.();
    });

  }

  private static _log (message: string | string[], title: string = '', titleColor?: Color, level: LogLevel = LogLevel.INFO) {
    if (Array.isArray(message)) {
      message = message.join(' ');
    }
    this.instance.logger.log(level, message, { title, titleColor });
  }

  public static type (title: string, titleColor: Color, content: number | string | string[], level: LogLevel = LogLevel.INFO) {
    if (Array.isArray(content)) {
      content = content.join(' ');
    }
    this.instance.typingLogger.log(level, String(content), { title, titleColor });
  }

  public static debug (content: string | string[], title?: string, titleColor?: Color) {
    this._log(content, title, titleColor, LogLevel.DEBUG);
  }

  public static warn (content: string | string[], title?: string, titleColor?: Color) {
    this._log(content, title, titleColor, LogLevel.WARN);
  }

  public static error (content: string | string[], title?: string) {
    this._log(content, title, Color.red, LogLevel.ERROR);
  }

  public static print (message: string): void;
  public static print (color: Color, message: string): void;
  public static print (messageOrColor: string | Color, message?: string): void {
    console.log(message !== undefined ? `${messageOrColor}${message}${ResetColor}` : messageOrColor);
  }

  public static set level (level: LogLevel) {
    this.instance.logger.level = level;
    this.instance.typingLogger.level = level;
  }

  private static _instance: Logger | undefined = undefined;
  private static _initialized: boolean = false;

  private typingLogger: winston.Logger;
  private logger: winston.Logger;

  private typingLoggerFinished: Promise<void>;
  private loggerFinished: Promise<void>;
  private typingLoggerFinishedResolved?: () => void;
  private loggerFinishedResolved?: () => void;
}