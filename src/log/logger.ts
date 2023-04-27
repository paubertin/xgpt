import { Config } from "../config";

export class Logger {
  public static log(...args: any[]) {
    console.log(...args);
  }

  public static error(...args: any[]) {
    console.error(...args);
  }

  public static debug(...args: any[]) {
    if (Config.debugMode) {
      console.log(...args);
    }
  }
}