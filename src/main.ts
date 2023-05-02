import { Config } from './config';
import { Colour, Logger } from './logger';
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
import { deleteAgent, listAgents, messageAgent, startAgent } from './commands/agents';
import { AgentManager } from './agent/agent.manager';
import { Memory } from './memory/base';
import readline from 'readline/promises';

const parser = new argparse.ArgumentParser({});

parser.add_argument('-c', '--continuous', { action: 'store_true', help: 'enable continous mode',  });

export async function main () {

  try {
    const workspaceDirectory: string = 'xgpt-workspace';

    
    const args = parser.parse_args();
    
    Config.init();
    await Logger.init();

    Logger.debug('Logger initialized...', 'TITRE', Colour.red);
    Logger.warn('this is a warning...', 'TITRE', Colour.yellow);
    Logger.error('this is an error', 'NON');
    Logger.type('This is a sentence', 'TITRE', Colour.yellow);

    AgentManager.init();
    Config.checkOpenAIAPIKey();
    OpenAI.init();
    await Python.init();

    await getMemory(true);

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

    registry.register(command(startAgent, {
      name: 'startAgent',
      description: 'Start a GPT agent with a given name, task, and prompt',
      args: {
        name: '<name>',
        task: '<task>',
        prompt: '<prompt>',
      },
    }));

    registry.register(command(messageAgent, {
      name: 'messageAgent',
      description: 'Message an agent with a given key and message',
      args: {
        key: '<key>',
        message: '<message>',
      },
    }));

    registry.register(command(listAgents, {
      name: 'listAgents',
      description: 'List all agents available',
      args: {
      },
    }));

    registry.register(command(deleteAgent, {
      name: 'deleteAgent',
      description: 'Delete an agent with a given key',
      args: {
        key: '<key>',
      },
    }));

    const aiConfig = await constructMainAIConfig();

    aiConfig.commandRegistry = registry;

    const systemPrompt = aiConfig.constructFullPrompt();
    Logger.debug('Prompt', systemPrompt);

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
  catch (err: any) {
    console.error('ERROR');
    console.error(err);
  }
  finally {
    await shutdown();
  }
}

async function shutdown() {
  // await Memory.shutdown();
  
  /*
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n\n');
  const exit = await rl.question('Press any key to exit...');

  process.exit(0);
  */
}
