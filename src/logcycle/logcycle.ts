import fs from 'fs';
import { Logger } from '../logs.js';
import path from 'path';

const DEFAULT_PREFIX = 'agent';
export const FULL_MESSAGE_HISTORY_FILE_NAME = 'full_message_history.json';
export const PROMPT_NEXT_ACTION_FILE_NAME = 'prompt_next_action.json';
export const NEXT_ACTION_FILE_NAME = 'next_action.json';

/**
 * A class for logging cycle data
 */
export class LogCycleHandler {
  public logCountWithinCycle: number = 0;

  public constructor () {}

  public static createDirectoryIfNotExists (directoryPath: string) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  public createOuterDirectory (aiName: string, createdAt: Date) {
    const logDirectory = Logger.getLogDirectory();
    let outerFolderName: string;
    if (process.env.OVERWRITE_DEBUG === '1') {
      outerFolderName = 'auto_gpt';
    }
    else {
      const aiNameShort = aiName ? aiName.slice(0, 15) : DEFAULT_PREFIX;
      outerFolderName = `${createdAt.toISOString()}_${aiNameShort}`;
    }

    const outerFolderPath = path.join(logDirectory, 'DEBUG', outerFolderName);
    LogCycleHandler.createDirectoryIfNotExists(outerFolderPath);
    return outerFolderPath;
  }

  public createInnerDirectory (outerFolderPath: string, cycleCount: number) {
    const nestedFolderName = String(cycleCount).padStart(3, '0');
    const nestedFolderPath = path.join(outerFolderPath, nestedFolderName);
    LogCycleHandler.createDirectoryIfNotExists(nestedFolderPath);
    return nestedFolderPath;
  }

  public createNestedDirectory (aiName: string, createdAt: Date, cycleCount: number) {
    const outerFolderPath = this.createOuterDirectory(aiName, createdAt);
    const nestedFolderPath = this.createInnerDirectory(outerFolderPath, cycleCount);
    return nestedFolderPath;
  }

  /**
   * Log cycle data to a JSON file. 
   */
  public logCycle (aiName: string, createdAt: Date, cycleCount: number, data: Record<string, any> | any, fileName: string) {
    const nestedFolderPath = this.createNestedDirectory(aiName, createdAt, cycleCount);
    const logFilePath = path.join(nestedFolderPath, `${this.logCountWithinCycle}_${fileName}`);
    Logger.logJson(data, logFilePath);
    this.logCountWithinCycle += 1;
  }


}