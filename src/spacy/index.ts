import { PythonShell } from "python-shell";
import Parse from "./parse";
import events, { EventEmitter } from "events";
import Type from "./type";

import InstallPythonPackages from "./InstallPythonPackages";
import { sleepAsync } from "../sleep";

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
    this.pyShell.on('message', (message) => {
      console.log('shell message', message);
      if (message === 'ready') {
        this.ready = true;
        console.log('Python ready');
        this.pyShell.removeAllListeners();
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
