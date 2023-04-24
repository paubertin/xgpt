import { OpenAIApi } from 'openai';
import { Config } from './config';
import { Logger } from './logger';
import nj from '@d4c/numjs';
import argparse from 'argparse';
import { getMemory } from './memory';
import { constructMainAIConfig } from './prompts';
import { Agent } from './agent/agent';
import { OpenAI } from './openai';
import { googleSearch } from './commands/googleSearch';
import { google } from 'googleapis';
import { CommandRegistry } from './commands/registry';
import { command } from './commands/command';
import { appendToFile, readFile, searchFiles, writeFile } from './commands/files';


const parser = new argparse.ArgumentParser({});

parser.add_argument('-c', '--continuous', { action: 'store_true', help: 'enable continous mode',  });

export async function main () {

  const args = parser.parse_args();

  Config.init();
  Config.checkOpenAIAPIKey();
  OpenAI.init();

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

  const aiConfig = await constructMainAIConfig();

  aiConfig.commandRegistry = registry;

  const systemPrompt = aiConfig.constructFullPrompt();
  console.log('system prompt', systemPrompt);

  const triggeringPrompt = 'Determine which next command to use, and respond using the format specified above:';
  const agent = new Agent('', memory, [], 0, registry, aiConfig, systemPrompt, triggeringPrompt);

  agent.startInteractionLoop();

}