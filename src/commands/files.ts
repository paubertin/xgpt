import fs from 'fs';
import path from 'path';
import { pathInWorkspace, workspacePath } from '../workspace';

const LOG_FILE = 'file.logger.txt';
const LOG_FILE_PATH = path.join(workspacePath, LOG_FILE);

async function checkDuplicateOperation (op: string, fileName: string) {
  const logContent = await readFile(path.join(workspacePath, fileName));
  const logEntry = `${op}: ${fileName}`;
  return logContent.includes(logEntry);
}

async function logOperation(op: string, fileName: string) {
  const entry = `${op}: ${fileName}`;
  if (!fs.existsSync(LOG_FILE_PATH)) {
    await fs.promises.writeFile(LOG_FILE_PATH, 'File operation logger ', { encoding: 'utf-8' });
  }
  await fs.promises.appendFile(LOG_FILE_PATH, entry, { encoding: 'utf-8' });
}

export async function readFile (fileName: string) {
  try {
    const filePath = pathInWorkspace(fileName);
    return (await fs.promises.readFile(filePath, { encoding: 'utf-8' })).toString();
  }
  catch (err: any) {
    return `Error: ${err}`;
  }
}

export async function writeFile (fileName: string, content: string) {
  if (await checkDuplicateOperation('write', fileName)) {
    return 'Error: File has already been updated.';
  }

  let filePath;
  try {
    filePath = pathInWorkspace(fileName);
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      await fs.promises.mkdir(directory, {recursive: true});
    }
    await fs.promises.writeFile(filePath, content, { encoding: 'utf-8' });
    await logOperation('write', fileName);
    return 'File written to successfully.';
  }
  catch (err: any) {
    console.error('Error while writing file', filePath ?? fileName);
    return `Error: ${err}`;
  }
}

export async function searchFiles (directory: string) {
  const foundFiles: string[] = [];
  let searchDirectory = directory;
  if (['', '/'].includes(directory)) {
    searchDirectory = workspacePath;
  }
  else {
    searchDirectory = pathInWorkspace(directory);
  }

  const res = await fs.promises.readdir(searchDirectory);
  for (const file of res) {
    if (file.startsWith('.')) {
      continue;
    }
    const relativePath = path.relative(path.join(searchDirectory, file), workspacePath);
    foundFiles.push(relativePath);
  }
  return foundFiles;
}

export async function appendToFile (fileName: string, content: string, shouldLog: boolean = true) {
  try {
    const filePath = pathInWorkspace(fileName);
    await fs.promises.appendFile(filePath, content, { encoding: 'utf-8' });
    if (shouldLog) {
      await logOperation('append', fileName);
    }
    return 'Text appended successfully.';
  }
  catch (err: any) {
    return `Error: ${err}`;
  }
}