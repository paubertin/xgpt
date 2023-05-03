import { Config } from '../config/index.js';
import { command } from './command.js';
import { appendToFile, createDir, readFile, searchFiles, writeFile } from './files.js';
import { googleSearch } from './googleSearch.js';
import { browseWebsite } from './web.js';
import { deleteAgent, listAgents, messageAgent, startAgent } from './agents.js'

export const commands = () => [
  command(googleSearch, {
    name: 'google',
    description: 'Google search',
    args: {
      query: 'query',
    },
    enabled: Config.googleApiKey !== undefined,
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