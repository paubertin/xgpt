import { Config } from '../config/index.js';
import { command } from './command.js';
import { appendToFile, createDir, downloadFile, readFile, searchFiles, writeFile } from './files.js';
import { googleSearch } from './googleSearch.js';
import { browseWebsite } from './web.js';
import { deleteAgent, listAgents, messageAgent, startAgent } from './agents.js'
import { wikipediaSearch } from './wikipedia.js';
import { analyseCode, generateCode, improveCode, writeTests } from './code.js';

export const commands = () => [
  command(googleSearch, {
    name: 'google',
    description: 'Google search',
    args: {
      query: 'query',
    },
    enabled: Config.googleApiKey !== undefined,
  }),

  command(wikipediaSearch, {
    name: 'wikipediaSearch',
    description: 'Wikipedia search',
    args: {
      query: 'query',
    },
  }),

  command(generateCode, {
    name: 'generateCode',
    description: 'Typescript code generation according to a given description',
    args: {
      description: '<description>',
    },
  }),

  command(improveCode, {
    name: 'improveCode',
    description: 'Improve given typescript code based on suggestions provided',
    args: {
      suggestions: '<suggestions>',
      code: '<code>',
    },
  }),

  command(analyseCode, {
    name: 'analyseCode',
    description: 'Analyse given code and suggest improvements',
    args: {
      code: '<code>',
    },
  }),

  command(writeTests, {
    name: 'writeTests',
    description: 'Generates test cases for the given code, focusing on specific areas if given',
    args: {
      code: '<code>',
      focus: '<focus>',
    },
  }),

  command(createDir, {
    name: 'createDir',
    description: 'Create a directory',
    args: {
      directory: 'directory',
    },
  }),

  command(writeFile, {
    name: 'writeFile',
    description: 'Write to file',
    args: {
      fileName: 'fileName',
      content: 'content',
    },
  }),

  command(appendToFile, {
    name: 'appendToFile',
    description: 'Append to file',
    args: {
      fileName: 'fileName',
      content: 'content',
      shouldLog: 'shouldLog',
    },
  }),

  command(readFile, {
    name: 'readFile',
    description: 'Read a file',
    args: {
      fileName: 'fileName',
    },
  }),

  command(searchFiles, {
    name: 'searchFiles',
    description: 'Search files in a directory',
    args: {
      directory: 'directory',
    },
  }),

  command(downloadFile, {
    name: 'downloadFile',
    description: 'Download a file',
    args: {
      url: 'url',
      fileName: 'path where you want to save the file locally',
    },
  }),

  command(browseWebsite, {
    name: 'browseWebsite',
    description: 'Browse Website',
    args: {
      url: 'url',
      question: 'what_you_want_to_find_on_website',
    },
  }),

  command(startAgent, {
    name: 'startAgent',
    description: 'Start a GPT agent with a given name, task, and prompt',
    args: {
      name: 'name',
      task: 'task',
      prompt: 'prompt',
    },
  }),

  command(messageAgent, {
    name: 'messageAgent',
    description: 'Message an agent with a given key and message',
    args: {
      key: 'key',
      message: 'message',
    },
  }),

  command(listAgents, {
    name: 'listAgents',
    description: 'List all agents available',
    args: {
    },
  }),

  command(deleteAgent, {
    name: 'deleteAgent',
    description: 'Delete an agent with a given key',
    args: {
      key: 'key',
    },
  }),
];