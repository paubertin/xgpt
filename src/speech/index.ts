import { VoiceEngine } from "./base.js";
import { BrianSpeech } from "./brian.js";

export function getVoiceEngine () {
  let engine: VoiceEngine;
  try {
    engine = VoiceEngine.instance;
  }
  catch {
    engine = VoiceEngine.init(BrianSpeech);
  }
  return engine;
}

class Queue {
  private _queue: any[] = [];
  private _pendingPromises: number = 0;
  
  public constructor (public maxPendingPromises: number, public maxQueuedPromises: number) {}

  public add (promiseGenerator: any) {
    return new Promise((resolve, reject) => {
      if (this._queue.length >= this.maxQueuedPromises) {
        reject(new Error('Queue limit reached'));
        return;
      }

      this._queue.push({
        promiseGenerator,
        resolve,
        reject,
      });

      this._dequeue();
    });
  }

  private _dequeue () {
    if (this._pendingPromises >= this.maxPendingPromises) {
      return false;
    }

    const item = this._queue.shift();
    if (!item) {
      return false;
    }

    try {
      this._pendingPromises++;
      this._resolveWith(item.promiseGenerator())
        .then((value: any) => {
          this._pendingPromises--;
          item.resolve(value);
          this._dequeue();
        }, (err: any) => {
          this._pendingPromises--;
          item.reject(err);
          this._dequeue();
        })
    }
    catch (err: any) {
      this._pendingPromises--;
      item.reject(err);
      this._dequeue();
    }
  }

  private _resolveWith (value: any) {
    if (value && typeof value.then === 'function') {
      return value;
    }
    return new Promise((resolve) => resolve(value));
  }

}

const queue = new Queue(1, Infinity);

export async function sayText (text: string) {
  queue.add(async () => {
    const engine = getVoiceEngine();
    await VoiceEngine.say(text);
  });
}
