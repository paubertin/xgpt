import { Config } from "./config/index.js";
import { createChatCompletion } from "./llm.utils.js";
import { Memory } from "./memory/base.js";
import { Message, Model, Role } from "./openai.js";
import { countMessageTokens } from "./token-counter.js";
import { sleepAsync } from "./sleep.js";
import { Logger } from "./logs.js";
import { Agent } from "./agent/agent.js";
import { getNewlyTrimmedMessages, updateRunningSummary } from "./memory-management/summary-memory.js";

/**
 * Interact with the OpenAI API, sending the prompt, user input, message history, and permanent memory
 */
export async function chatWithAI (agent: Agent, prompt: string, userInput: string, fullMessageHistory: Message[], tokenLimit: number) {
  let loop = true;
  while (loop) {
    try {
      const model = Config.fastLLMModel;
      Logger.debug(`Token limit: ${tokenLimit}`);
      const sendTokenLimit = tokenLimit - 1000;

      const relevantMemory = '';
      Logger.debug(`Memory stats: ${await Memory.getStats()}`);

      let {
        nextMessageToAddIndex,
        currentTokensUsed,
        insertionIndex,
        currentContext
      } = await generateContext(prompt, fullMessageHistory, model);

      currentTokensUsed += await countMessageTokens([createChatMessage('user', userInput)], model);

      currentTokensUsed += 500;

      while (nextMessageToAddIndex >=0) {
        const messageToAdd = fullMessageHistory[nextMessageToAddIndex];
        const tokensToAdd = await countMessageTokens([ messageToAdd ], model);
        if (currentTokensUsed + tokensToAdd > sendTokenLimit) {
          break;
        }
        currentContext.splice(insertionIndex, 0, fullMessageHistory[nextMessageToAddIndex]);

        currentTokensUsed += tokensToAdd;
        nextMessageToAddIndex -= 1;
      }

      if (fullMessageHistory.length > 0) {
        const { newMessagesNotInContext, newIndex } = getNewlyTrimmedMessages(fullMessageHistory, currentContext, agent.lastMemoryIndex);
        agent.lastMemoryIndex = newIndex;

        agent.summarymemory = await updateRunningSummary(agent.summarymemory, newMessagesNotInContext);

        currentContext.splice(insertionIndex, 0, agent.summarymemory);
      }

      currentContext.push(createChatMessage('user', userInput));

      const tokensRemaining = tokenLimit - context.currentTokensUsed;

      const debug = false;
      if (debug) {
        console.debug('Token limit:', tokenLimit);
        console.debug('Send Token Count:', context.currentTokensUsed);
        console.debug('Tokens remaining for response:', tokensRemaining);
        console.debug('------------ CONTEXT SENT TO AI ---------------');
        for (const message of context.currentContext) {
          if (message.role === 'system' && message.content === prompt) {
            continue;
          }
          else {
            console.debug(`${message.role}: ${message.content}`);
          }
        }
        console.debug('------------- END OF CONTEXT ------------------');
      }

      const assistantReply = await createChatCompletion(context.currentContext, model, undefined, tokensRemaining);

      fullMessageHistory.push(createChatMessage('user', userInput));
      fullMessageHistory.push(createChatMessage('assistant', assistantReply));

      loop = false;
      return assistantReply;
    }
    catch (err: any) {
      console.error(err);
      await sleepAsync(10000);
    }
  }
}

/**
 * Create a chat message with the given role and content.
 */
export function createChatMessage  (role: Role, content: string): Message {
  return {
    role,
    content,
  };
}

/**
 * Create a chat message with the given role and content.
 */
async function generateContext (prompt: string, fullMessageHistory: Message[], model: Model) {
  const currentContext = [
    createChatMessage('system', prompt),
    createChatMessage('system', `The current time and date is ${(new Date()).toLocaleString()}`),
  ];

  return {
    nextMessageToAddIndex: fullMessageHistory.length - 1,
    currentTokensUsed: await countMessageTokens(currentContext, model),
    insertionIndex: currentContext.length,
    currentContext,
  };
}