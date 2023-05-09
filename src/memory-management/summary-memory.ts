import { fixAndParseJson } from "../agent/agent.js";
import { Config } from "../config/index.js";
import { createChatCompletion } from "../llm.utils.js";
import { Message } from "../openai.js";

/**
 * This function returns a list of dictionaries contained in full_message_history
 * with an index higher than prev_index that are absent from current_context.
 */
export function getNewlyTrimmedMessages(fullMessageHistory: Message[], currentContext: Message[], lastMemoryIndex: number) {
  const newMessages: Message[] = [];
  for (let i = lastMemoryIndex + 1; i < fullMessageHistory.length; ++i) {
    newMessages.push(fullMessageHistory[i]);
  }

  const newMessagesNotInContext = newMessages.filter((msg) => {
    return !currentContext.includes(msg);
  });

  let newIndex = lastMemoryIndex;
  if (newMessagesNotInContext.length) {
    const lastMessage = newMessagesNotInContext.at(-1);
    newIndex = fullMessageHistory.indexOf(lastMessage!);
  }

  return {
    newMessagesNotInContext,
    newIndex,
  };
}

export async function updateRunningSummary (currentMemory: Message, events: Message[]) {
  console.log('updateRunningSummary');
  const newEvents = [...events];
  let eventsToKeep: Message[] | string = [];
  for (const event of newEvents) {
    console.log('event', event);
    if (event.role === 'assistant') {
      (event as any).role = 'you';
      const content = await fixAndParseJson(event.content);
      delete content.thoughts;
      event.content = JSON.stringify(content);
    }
    else if (event.role === 'system') {
      (event as any).role = 'your computer';
    }
    else if (event.role === 'user') {
      continue;
    }
    eventsToKeep.push(event);
  }

  if (eventsToKeep.length === 0) {
    eventsToKeep = 'Nothing new happened';
  }

  const prompt = `Your task is to create a concise running summary of actions and information results in the provided text, focusing on key and potentially important information to remember.

You will receive the current summary and the your latest actions. Combine them, adding relevant key information from the latest development in 1st person past tense and keeping the summary concise.

Summary So Far:
"""
${currentMemory.content}
"""

Latest Development:
"""
${eventsToKeep}
"""
`;
  const messages: Message[] = [
    {
      role: 'user',
      content: prompt,
    }
  ];

  const result = await createChatCompletion(messages, Config.fastLLMModel);

  const messageToReturn: Message = {
    role: 'system',
    content: `This reminds you of these events from your past: \n${result}`,
  };

  return messageToReturn;
}