import { PythonShell } from "python-shell";

import { Message, Model } from "../openai.js";

export class Python {

  public static async countMessageTokens (messages: Message[], model: Model = 'gpt-3.5-turbo-0301') {
    
    return new Promise<number>(async (resolve, reject) => {
      const shell = new PythonShell('./src/python/scripts/count_message_tokens.py');
      shell.send(JSON.stringify({
        messages,
        model,
      }));
      shell.on('message', (...args: any[]) => {
        // console.log('on message', args);
        const count = parseInt(args[0], 10);
        if (args.length !== 1 || isNaN(count)) {
          reject('Incorrect value');
        }
        shell.end((err, exitCode, exitSignal) => {
          /*
          console.log('END SHELL');
          console.log('err', err);
          console.log('exitCode', exitCode);
          console.log('exitSignal', exitSignal);
          */
        });
        resolve(count);
      });
      shell.on('error', (err) => {
        // console.error('error', err);
        reject(err);
      });
      shell.on('pythonError', (err) => {
        // console.error('python error', err);
        reject(err);
      });
      shell.on('close', () => {
        // console.log('closing shell...');
      });
    });
  }

  private constructor () {}
}
