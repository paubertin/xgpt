import { Config, ConfigOptions } from './config/index.js';
import { Color, LogLevel, Logger } from './logs.js';
import argparse from 'argparse';
import { DEFAULT_TRIGGERING_PROMPT, constructMainAIConfig } from './prompts/index.js';
import { Agent } from './agent/agent.js';
import { OpenAI } from './openai.js';
import { CommandRegistry } from './commands/registry.js';
import { Workspace } from './workspace.js';
import path from 'path';
import fs from 'fs';
import { Python } from './spacy/index.js';
import { Memory } from './memory/base.js';
import { getMemory } from './memory/index.js';
import { AutoGPTError } from './utils.js';
import { commands } from './commands/index.js';

import { Spinner } from './log/spinner.js';

const parser = new argparse.ArgumentParser({});

parser.add_argument('-c', '--continuous', { action: 'store_true', help: 'Enable continous mode' });
parser.add_argument('-y', '--skip-reprompt', { action: 'store_true', help: 'Skips the re-prompting messages at the beginning of the script' });
parser.add_argument('-C', '--ai-settings', { metavar: 'path_to_ai_settings.json', help: 'Specifies which ai_settings.json file to use, will also automatically skip the re-prompt' });
parser.add_argument('-l', '--continuous-limit', { type: 'int', help: 'Defines the number of times to run in continuous mode' });
parser.add_argument('--speak', { action: 'store_true', help: 'Enable speak mode' });
parser.add_argument('--debug', { action: 'store_true', help: 'Enable debug mode' });
parser.add_argument('--gpt3only', { action: 'store_true', help: 'Enable GPT3.5 only mode' });
parser.add_argument('--gpt4only', { action: 'store_true', help: 'Enable GPT4 only mode' });
parser.add_argument('-m', '--use-memory', { metavar: 'memory_type', type: 'str', help: 'Defines which memory backend to use' });
// parser.add_argument('-b', '--browser-name', { type: 'string', help: 'Specifies which web-browser to use when using selenium to scrape the web' });
parser.add_argument('--allow-downloads', { action: 'store_true', help: 'Dangerous: Allows Auto-GPT to download files natively' });

export async function main () {
  try {
    
    const parsedArgs: ConfigOptions = parser.parse_args();
    
    await Logger.init();
    Logger.level = parsedArgs.debug ? LogLevel.DEBUG : LogLevel.INFO;

    process.on('SIGINT', () => {
      Logger.info('You interrupted Auto-GPT');
      Logger.info('Quitting...');
      throw new AutoGPTError('Auto-GPT interrupt', () => process.exit(0));
    });
  
    Config.init(parsedArgs);
    Config.checkOpenAIAPIKey();
  
    OpenAI.init();

    const workspaceDirectory = Workspace.makeWorkspace(Config.workspaceDirectory);

    const fileLoggerPath = path.join(workspaceDirectory, 'file_logger.txt');
    if (!fs.existsSync(fileLoggerPath)) {
      await fs.promises.writeFile(fileLoggerPath, 'File Operation Logger\n\n', { encoding: 'utf-8' });
    }

    Config.fileLoggerPath = fileLoggerPath;

    const commandRegistry = new CommandRegistry();

    commands().forEach((command) => {
      commandRegistry.register(command);
    });

    const aiName: string = '';

    const aiConfig = await constructMainAIConfig();
    aiConfig.commandRegistry = commandRegistry;
  
    const fullMessageHistory = [];
    const nextActionCount = 0;

    const memory = await getMemory(true);

    Logger.type('Using memory of type:', Color.green, memory.constructor.name);
    
    const systemPrompt = aiConfig.constructFullPrompt();

    if (Config.debugMode) {
      Logger.type('Prompt:', Color.green, systemPrompt);
    }

    const agent = new Agent({
      aiName,
      fullMessageHistory,
      nextActionCount,
      commandRegistry,
      config: aiConfig,
      systemPrompt,
      triggeringPrompt: DEFAULT_TRIGGERING_PROMPT,
      workspaceDirectory,
    });
  
    agent.startInteractionLoop();
  
    shutdown(0);

    await Python.init();
  }
  catch (err: any) {
    if (err instanceof AutoGPTError) {
      // Logger.print(Color.red, 'AutoGPTError: '+ err.message);
      if (err.callback) {
        shutdown(err.callback);
      }
      else {
        shutdown(1);
      }
    }
    else {
      Logger.print(Color.red, 'Error: '+ err.message);
      shutdown(1)
    }
  }
}

async function shutdown(value: number): Promise<void>;
async function shutdown(value: () => void): Promise<void>;
async function shutdown(value: number | (() => void)): Promise<void> {
  await Logger.shutdown();
  await Memory.shutdown();
  
  if (typeof value === 'number') {
    process.exit(value);
  }
  else {
    value();
  }
}
