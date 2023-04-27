import fs from 'fs';
import path from 'path';
import { Config } from '../config';

async function checkDuplicateOperation (op: string, fileName: string) {
  const logContent = await readFile(Config.fileLoggerPath);
  const logEntry = `${op}: ${fileName}`;
  return logContent.includes(logEntry);
}

async function logOperation(op: string, fileName: string) {
  const entry = `${op}: ${fileName}\n`;
  await appendToFile(Config.fileLoggerPath, entry, false);
}

export async function readFile (fileName: string) {
  try {
    return (await fs.promises.readFile(fileName, { encoding: 'utf-8' })).toString();
  }
  catch (err: any) {
    return `Error: ${err}`;
  }
}
export async function createDir (directory: string) {
  if (await checkDuplicateOperation('createDir', directory)) {
    return 'Error: Directory has already been created.';
  }
  try {
    await fs.promises.mkdir(directory, { recursive: true });
    return 'Directory created successfully.';
  }
  catch (err: any) {
    console.error('Error while creating directory', directory);
    return `Error: ${err}`;
  }
}

export async function writeFile (fileName: string, content: string) {
  if (await checkDuplicateOperation('write', fileName)) {
    return 'Error: File has already been created.';
  }

  try {
    const directory = path.dirname(fileName);
    if (!fs.existsSync(directory)) {
      await fs.promises.mkdir(directory, {recursive: true});
    }
    await fs.promises.writeFile(fileName, content, { encoding: 'utf-8' });
    await logOperation('write', fileName);
    return 'File written successfully.';
  }
  catch (err: any) {
    console.error('Error while writing file', fileName);
    return `Error: ${err}`;
  }
}

export async function searchFiles (directory: string) {
  const foundFiles: string[] = [];

  const res = await fs.promises.readdir(directory);
  for (const file of res) {
    if (file.startsWith('.')) {
      continue;
    }
    const relativePath = path.relative(path.join(directory, file), Config.workspacePath);
    foundFiles.push(relativePath);
  }
  return foundFiles;
}

export async function appendToFile (fileName: string, content: string, shouldLog: boolean = true) {
  try {
    await fs.promises.appendFile(fileName, content, { encoding: 'utf-8' });
    if (shouldLog) {
      await logOperation('append', fileName);
    }
    return 'Text appended successfully.';
  }
  catch (err: any) {
    return `Error: ${err}`;
  }
}