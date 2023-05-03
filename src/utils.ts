import fs from 'fs';

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