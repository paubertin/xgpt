import fs from 'fs';
import readline from 'readline/promises';
import { Color, Logger } from './logs.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

export async function exists (path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  }
  catch (err: any) {
    return false;
  }
}

export class AutoGPTError extends Error {
  public callback?: () => void;

  public constructor (message: string, cb?: () => void) {
    super(message);
    this.callback = cb;
  }
}

export async function cleanInput (prompt: string, color?: Color) {
  Logger.info('Asking user via keyboard...');
  if (color) {
    prompt = `${color}${prompt}${Color.reset}`;
  }
  const answer = await rl.question(prompt + ' ');
  return answer;
}