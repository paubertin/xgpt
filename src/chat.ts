import { Config } from "./config/index.js";
import { createChatCompletion } from "./llm.utils.js";
import { Memory } from "./memory/base.js";
import { Message, Model, Role } from "./openai.js";
import { countMessageTokens } from "./token-counter.js";
import { sleepAsync } from "./sleep.js";
import { Logger } from "./logs.js";
import { Agent } from "./agent/agent.js";
import { getNewlyTrimmedMessages, updateRunningSummary } from "./memory-management/summary-memory.js";
import { ApiManager } from "./llm/apiManager.js";
import { AxiosError } from 'axios';

/**
 * Interact with the OpenAI API, sending the prompt, user input, message history, and permanent memory
 */
export async function chatWithAI (agent: Agent, prompt: string, userInput: string, fullMessageHistory: Message[], tokenLimit: number) {
  const model = Config.fastLLMModel;
  while (true) {
    try {
      Logger.debug(`Token limit: ${tokenLimit}`);
      const sendTokenLimit = tokenLimit - 1000;

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

        agent.summaryMemory = await updateRunningSummary(agent.summaryMemory, newMessagesNotInContext);

        currentContext.splice(insertionIndex, 0, agent.summaryMemory);
      }

      if (ApiManager.totalBudget > 0) {
        let remainingBudget = ApiManager.totalBudget - ApiManager.totalCost;
        if (remainingBudget < 0) {
          remainingBudget = 0;
        }
        let systemMessage = `Your remaining budget is ${remainingBudget.toFixed(3)}`;
        systemMessage += remainingBudget === 0
          ? ' BUDGET EXCEEDED! SHUT DOWN!\n\n'
          : (remainingBudget < 0.005
            ? ' Budget very nearly exceeded! Shut down gracefully!\n\n'
            : (remainingBudget < 0.01
              ? ' Budget nearly exceeded. Finish up.\n\n'
              : '\n\n'
            ));

        Logger.debug(systemMessage);
        currentContext.push(createChatMessage('system', systemMessage));
      }

      currentContext.push(createChatMessage('user', userInput));

      const tokensRemaining = tokenLimit - currentTokensUsed;

      Logger.debug(`Token limit: ${tokenLimit}`);
      Logger.debug(`Send Token Count: ${currentTokensUsed}`);
      Logger.debug(`Tokens remaining for response: ${tokensRemaining}`);
      Logger.debug('------------ CONTEXT SENT TO AI ---------------');
      for (const message of currentContext) {
        if (message.role === 'system' && message.content === prompt) {
          continue;
        }
        else {
          Logger.debug(`${message.role}: ${message.content}`);
          Logger.debug('');
        }
      }
      Logger.debug('------------- END OF CONTEXT ------------------');

      const assistantReply = await createChatCompletion(currentContext, model, undefined, tokensRemaining);

      fullMessageHistory.push(createChatMessage('user', userInput));
      fullMessageHistory.push(createChatMessage('assistant', assistantReply));

      return assistantReply;
    }
    catch (err: any) {
      const { response } = err as AxiosError;
      switch (response?.status) {
        case 400:
          Logger.error('OpenAI API Error', 'Context window is full.');
        case 404:
          Logger.error('OpenAI API Error', `Model '${model}' is unavailable.`);
        case 429: {
          Logger.warn('OpenAI API Error', 'API Rate Limit Reached. Waiting 10 seconds...');
          await sleepAsync(10000);
          break;
        }
        default:
          throw err;
      }
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