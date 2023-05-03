import { PythonShell } from "python-shell";
import Parse from "./parse.js";
import { EventEmitter } from "events";

import InstallPythonPackages from "./InstallPythonPackages.js";
import { sleepAsync } from "../sleep.js";

export class Python {

  public static async init () {
    if (this._initialized) {
      return this._instance!;
    }
    this._instance = new Python();
    await this._instance._init();
    this._initialized = true;
    return this._instance;
  }

  public static async test () {
    PythonShell.run(
      './src/spacy/test.py',
      {
        mode: 'text',
        pythonOptions: [ '-u' ],
        args: [ 'arg1', 'arg2' ],
      },
      (err, result) => {
        if (err) throw err;
        // result is an array consisting of messages collected
        //during execution of script.
        console.log('result: ', result);
      },
    );
  }

  /*
export interface Options extends SpawnOptions {
    mode?: 'text' | 'json' | 'binary';
    formatter?: string | ((param: string) => any);
    parser?: string | ((param: string) => any);
    stderrParser?: string | ((param: string) => any);
    encoding?: BufferEncoding;
    pythonPath?: string;
    pythonOptions?: string[];
    scriptPath?: string;
    args?: string[];
}
  */

  public static async sendMessage (msg: any) {
    
    return new Promise<any>(async (resolve, reject) => {
      const shell = new PythonShell('./src/spacy/test.py');
      shell.send(msg);
      shell.on('message', (...args: any[]) => {
        console.log('on message', args);
        shell.end((err, exitCode, exitSignal) => {
          console.log('END SHELL');
          console.log('err', err);
          console.log('exitCode', exitCode);
          console.log('exitSignal', exitSignal);
        });
        resolve(args);
      });
      shell.on('error', (err) => {
        console.error('error', err);
        reject(err);
      });
      shell.on('pythonError', (err) => {
        console.error('python error', err);
        reject(err);
      });
      shell.on('close', () => {
        console.log('closing shell...');
      });
    });
  }

  public static async parseSentences (text: string = '', timeoutLimit: number = 30000, index: number = 0) {
    if (!text || text.length <= 0) {
      throw new Error('Input text invalid');
    }
  
    return new Promise<string[]>(async (resolve, reject) => {
      // check if its ready and if yes then continue
      while (!this.isReady()) {
        console.log("Waiting for SpaCy to be ready");
        await sleepAsync(2000);
      }
  
      const TAG =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
  
      const Data: { tag: any; results: string[]; error: any } = await Parse(
        this.instance.processEmitter,
        this.instance.pyShell,
        { TAG, query: text, timeoutLimit },
        index
      );
  
      let tag, results, error;
      if (Data) {
        tag = Data.tag;
        results = Data.results;
        error = Data.error;
      }
      if (error) return reject({ error: "No response received, Time out" });
  
      this.instance.pyShell.removeAllListeners();
  
      resolve(results);
    });

  }

  private async _init () {
    return new Promise<boolean>((resolve, reject) => {
      this.pyShell.on('message', (message) => {
        console.log('shell message', message);
        if (message === 'ready') {
          this.ready = true;
          console.log('Python ready');
          this.pyShell.removeAllListeners();
          resolve(true);
        }
      });

      process.on('SIGINT', () => {
        this.pyShell.end((err, code, signal) => {
          if (err) throw err;
          //   console.log("The exit code was: " + code);
          //   console.log("The exit signal was: " + signal);
          console.log("finished");
        });
        process.exit(0);
      });

      process.on('exit', () => {
        this.pyShell.end((err, code, signal) => {
          if (err) throw err;
          //   console.log("The exit code was: " + code);
          //   console.log("The exit signal was: " + signal);
          console.log("finished");
        });
        process.exit(0);
      });

      process.on('uncaughtException', (exception) => {
        console.log(exception);

        this.pyShell.end((err, code, signal) => {
          if (err) throw err;
          //   console.log("The exit code was: " + code);
          //   console.log("The exit signal was: " + signal);
          console.log("finished");
        });
        process.exit(0);
      });
    
      this.pyShell.send('check');
    });
  }

  private async installPackages () {
    try {
      const InstallPythonPackages_call = await InstallPythonPackages();
      let pip;
      let python;
      if (InstallPythonPackages_call) {
        pip = InstallPythonPackages_call.pip;
        python = InstallPythonPackages_call.python;
      }
      if (pip || python) {
        await InstallPythonPackages(pip, python);
      }
    } catch (error) {
      console.error('error init python', error);
    }
  }

  public static get instance () {
    if (!this._instance) {
      throw new Error('Python not initialized');
    }
    return this._instance;
  }

  public static isReady () {
    return this.instance.ready;
  }

  private static _instance: Python | undefined = undefined;
  private static _initialized: boolean = false;

  private pyShell: PythonShell;
  private ready: boolean = false;
  private processEmitter: EventEmitter;

  private constructor () {
    this.pyShell = new PythonShell('./src/spacy/SpaCy.py');
    this.processEmitter = new EventEmitter();
  }
}
