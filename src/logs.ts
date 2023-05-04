import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { exists } from './utils.js';
import { ResponseJSONFormat } from "./prompts/generator.js";

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
  black = '\x1B[30m',
  red = '\x1B[31m',
  green = '\x1B[32m',
  yellow = '\x1B[33m',
  blue = '\x1B[34m',
  magenta = '\x1B[35m',
  cyan = '\x1B[36m',
  white = '\x1B[37m',

  reset = '\x1B[0m',
}

export class Logger {

  private static logFileName: string = 'activity.log';
  private static errorFileName: string = 'error.log';

  private static logDir: string;

  public static getLogDirectory () {
    return this.logDir;
  }

  public static async init () {
    if (this._initialized) {
      return;
    }

    this.logDir = path.resolve(path.join(process.cwd(), 'logs'));
    if (!exists(this.logDir)) {
      await fs.promises.mkdir(this.logDir, { recursive: true });
    }

    this._instance = new Logger(this.logDir);
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
      this.instance.jsonLoggerFinished,
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
              ? `${titleColor}${title}${Color.reset}`
              : title
            : '';
          if (titleString) {
            process.stdout.write(titleString + ' ');
          }
          while (message.length > 0) {
            process.stdout.write(message[0]);
            message = message.slice(1);

            const delay = 5 + (1 - Math.random()) * 25;
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
            return `${timestamp} [${level.toUpperCase()}] ${title ? `${title} ${message}` : `${message}`}`;
          }),
        ) }),
        new winston.transports.File({ filename: path.join(logDir, Logger.errorFileName), level: LogLevel.ERROR, format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, title }) => {
            return `${timestamp} [${level.toUpperCase()}] ${title ? `${title} ${message}` : `${message}`}`;
          }),
        ) }),
      ],
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.printf(({ title, titleColor, level, message }) => {
          const titleString = title
            ? titleColor
              ? `${titleColor}${title}${Color.reset}`
              : title
            : '';
          return titleString ? `${titleString} ${message}` : message;
        }),
      ),
    });

    this.jsonLogger = winston.createLogger({
      level: LogLevel.DEBUG,
      transports: [
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

    this.typingLoggerFinished = new Promise((resolve) => this.typingLoggerFinishedResolved = resolve);
    this.loggerFinished = new Promise((resolve) => this.loggerFinishedResolved = resolve);
    this.jsonLoggerFinished = new Promise((resolve) => this.jsonLoggerFinishedResolved = resolve);
    this.typingLogger.on('finish', () => {
      this.typingLoggerFinishedResolved?.();
    });
    this.logger.on('finish', () => {
      this.loggerFinishedResolved?.();
    });
    this.jsonLogger.on('finish', () => {
      this.jsonLoggerFinishedResolved?.();
    });
  }

  private static _log (message: string | string[], title: string = '', titleColor?: Color, level: LogLevel = LogLevel.INFO) {
    if (Array.isArray(message)) {
      message = message.join(' ');
    }
    this.instance.logger.log(level, message, { title, titleColor });
  }

  public static type (title: string, titleColor: Color, content?: number | string | string[], level: LogLevel = LogLevel.INFO) {
    if (Array.isArray(content)) {
      content = content.join('\n');
    }
    this.instance.typingLogger.log(level, content !== undefined ? String(content) : '', { title, titleColor });
  }

  public static debug (content: string | string[], title?: string, titleColor?: Color) {
    this._log(content, title, titleColor, LogLevel.DEBUG);
  }

  public static info (content: string | string[], title?: string, titleColor?: Color) {
    this._log(content, title, titleColor, LogLevel.INFO);
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
    console.log(message !== undefined ? `${messageOrColor}${message}${Color.reset}` : messageOrColor);
  }

  public static logJson (data: any, fileName: string) {
    const jsonTransport = new winston.transports.File({ filename: fileName, format: winston.format.json() });
    this.instance.jsonLogger.add(jsonTransport);
    this.instance.jsonLogger.debug(data);
    this.instance.jsonLogger.remove(jsonTransport);
  }

  public static set level (level: LogLevel) {
    this.instance.logger.level = level;
    this.instance.typingLogger.level = level;
  }

  private static _instance: Logger | undefined = undefined;
  private static _initialized: boolean = false;

  private typingLogger: winston.Logger;
  private logger: winston.Logger;
  private jsonLogger: winston.Logger;

  private typingLoggerFinished: Promise<void>;
  private loggerFinished: Promise<void>;
  private jsonLoggerFinished: Promise<void>;
  private typingLoggerFinishedResolved?: () => void;
  private loggerFinishedResolved?: () => void;
  private jsonLoggerFinishedResolved?: () => void;
}

export function printAssistantThoughts (name: string, json: ResponseJSONFormat) {
  console.log(`${name.toUpperCase()} THOUGHTS: ${json.thoughts.text}`);
  console.log(`REASONING: ${json.thoughts.reasoning}`);
  if (json.thoughts.plan) {
    console.log('PLAN:');
    const lines = json.thoughts.plan.split('\n').map((l) => l.trim());
    for (const line of lines) {
      const i = line.indexOf('- ');
      let l = line;
      if (i >= 0) {
        l = l.substring(i + 2);
      }
      console.log(`- ${l.trim()}`);
    }
  }
  console.log(`CRITICISM: ${json.thoughts.criticism}`);
}