import { Config } from './config';
import { Logger } from './log/logger';
import argparse from 'argparse';
import { getMemory } from './memory';
import { constructMainAIConfig } from './prompts';
import { Agent } from './agent/agent';
import { OpenAI } from './openai';
import { googleSearch } from './commands/googleSearch';
import { CommandRegistry } from './commands/registry';
import { command } from './commands/command';
import { appendToFile, createDir, readFile, searchFiles, writeFile } from './commands/files';
import { Workspace } from './workspace';
import path from 'path';
import fs from 'fs';
import { browseWebsite } from './commands/web';
import { Python } from './spacy';

const parser = new argparse.ArgumentParser({});

parser.add_argument('-c', '--continuous', { action: 'store_true', help: 'enable continous mode',  });

export async function main () {

  const workspaceDirectory: string = 'xgpt-workspace';

  const args = parser.parse_args();

  Config.init();
  Config.checkOpenAIAPIKey();
  OpenAI.init();
  await Python.init();

  const memory = getMemory(true);

  const registry = new CommandRegistry();

  registry.register(command(googleSearch, {
    name: 'google',
    description: 'Google search',
    args: {
      query: '<query>',
    },
    enabled: Config.googleApiKey !== undefined,
  }));

  registry.register(command(createDir, {
    name: 'createDir',
    description: 'Create a directory',
    args: {
      directory: '<directory>',
    },
  }));

  registry.register(command(writeFile, {
    name: 'writeFile',
    description: 'Write to file',
    args: {
      fileName: '<fileName>',
      content: '<content>',
    },
  }));

  registry.register(command(appendToFile, {
    name: 'appendToFile',
    description: 'Append to file',
    args: {
      fileName: '<fileName>',
      content: '<content>',
      shouldLog: '<shouldLog>',
    },
  }));

  registry.register(command(readFile, {
    name: 'readFile',
    description: 'Read a file',
    args: {
      fileName: '<fileName>',
    },
  }));

  registry.register(command(searchFiles, {
    name: 'searchFiles',
    description: 'Search files in a directory',
    args: {
      directory: '<directory>',
    },
  }));

  registry.register(command(browseWebsite, {
    name: 'browseWebsite',
    description: 'Browse Website',
    args: {
      url: '<url>',
      question: '<what_you_want_to_find_on_website>',
    },
  }));

  const aiConfig = await constructMainAIConfig();

  aiConfig.commandRegistry = registry;

  const systemPrompt = aiConfig.constructFullPrompt();
  Logger.log('Prompt', systemPrompt);

  const triggeringPrompt = 'Determine which next command to use, and respond using the format specified above:';

  const workspacePath = Workspace.makeWorkspace(workspaceDirectory);

  Config.workspacePath = workspacePath;

  const fileLoggerPath = path.join(workspacePath, 'file_logger.txt');
  if (!fs.existsSync(fileLoggerPath)) {
    await fs.promises.writeFile(fileLoggerPath, 'File Operation Logs\n\n', { encoding: 'utf-8' });
  }

  Config.fileLoggerPath = fileLoggerPath;

  const agent = new Agent({
    aiName: '',
    memory,
    fullMessageHistory: [],
    nextActionCount: 0,
    commandRegistry: registry,
    config: aiConfig,
    systemPrompt,
    triggeringPrompt,
    workspaceDirectory: workspacePath,
  });

  agent.startInteractionLoop();

}