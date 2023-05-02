import { ChatCompletionRequestMessage } from "openai";
import { Config } from "../config";
import { Memory } from "./base";
import { LocalCache } from "./local";
import { WeaviateMemory } from "./weaviate";
import { createChatCompletion } from "../llm.utils";

export async function getMemory (init: boolean = false) {
  let memory: Memory;
  try {
    memory = Memory.instance;
  }
  catch {
    const memoryBackend = Config.memoryBackend;
  
    switch (memoryBackend) {
      case 'weaviate': {
        memory = await Memory.init(WeaviateMemory);
        break;
      }
      case 'local':
      default: {
        memory = await Memory.init(LocalCache);
        if (init) {
          Memory.clear();
        }
        break;
      }
    }
  }

  return memory;
}

/**
    This function returns a list of dictionaries contained in fullMessageHistory
    with an index higher than prevIndex that are absent from currentContext.
 */
export function getNewlyTrimmedMessages (fullMessageHistory: ChatCompletionRequestMessage[], currentContext: ChatCompletionRequestMessage[], lastmemoryIndex: number) {
  const newMessages: ChatCompletionRequestMessage[] = [];
  fullMessageHistory.forEach((message, idx) => {
    if (idx > lastmemoryIndex) {
      newMessages.push(message);
    }
  });
  const newMessagesNotInContext = newMessages.filter((message) => !currentContext.includes(message));

  let newIndex = lastmemoryIndex;
  if (newMessagesNotInContext.length) {
    newIndex = fullMessageHistory.indexOf(newMessagesNotInContext[newMessagesNotInContext.length - 1]);
  }

  return {
    newMessagesNotInContext,
    newIndex,
  };
}

/**
 * 
    This function takes a list of dictionaries representing new events and combines them with the current summary,
    focusing on key and potentially important information to remember. The updated summary is returned in a message
    formatted in the 1st person past tense.
 */
export async function updateRunningMemory (currentMemory: string, events: ChatCompletionRequestMessage[]) {
  const _newEvents = Array.from(events);
  const newEvents: ChatCompletionRequestMessage[] = [];
  for (const event of _newEvents) {
    if (event.role === 'assistant') {
      (event as any).role = 'you';
      const content = JSON.parse(event.content);
      delete content.thoughts;
      event.content = JSON.stringify(content);
    }
    else if (event.role === 'system') {
      (event as any).role = 'your computer';
    }
    else if (event.role === 'user') {
      // do not append
      continue;
    }
    newEvents.push(event);
  }

  if (newEvents.length === 0) {

  }

  const prompt = `Your task is to create a concise running summary of actions and information results in the provided text, focusing on key and potentially important information to remember.

You will receive the current summary and your latest actions. Combine them, adding relevant key information from the latest development in 1st person past tense and keeping the summary concise.

Summary So Far:
"""
${currentMemory}
"""

Latest Development:
"""
${newEvents.length === 0 ? 'Nothing new happened.' : newEvents.map((e) => { return `- ${e.role}: ${e.content}`; }).join('\n')}
"""
`
  const messages = [
    {
      role: 'user',
      content: prompt,
    }
  ];

  const curMem = await createChatCompletion(messages as any, Config.fastLLMModel);

  return curMem;
}