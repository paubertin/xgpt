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