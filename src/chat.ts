import { Config } from "./config";
import { createChatCompletion } from "./llm.utils";
import { Memory } from "./memory/base";
import { Message, Model, Role } from "./openai";
import { countMessageTokens } from "./token-counter";
import { sleepAsync } from "./sleep";

export async function chatWithAI (prompt: string, userInput: string, fullMessageHistory: Message[], permanentMemory: Memory, tokenLimit: number) {
  let loop = true;
  while (loop) {
    try {
      const model = Config.fastLLMModel;
      const sendTokenLimit = tokenLimit - 1000;

      let relevantMemory = fullMessageHistory.length === 0 ? [] : await permanentMemory.getRelevant('[' + fullMessageHistory.map((v) => '\'' + v + '\'').join(',') + ']', 10);

      console.log('Memory stats', permanentMemory.getStats());

      let context = generateContext(prompt, relevantMemory, fullMessageHistory, model);

      while (context.currentTokensUsed > 2500) {
        relevantMemory = relevantMemory.splice(-1);
        context = generateContext(prompt, relevantMemory, fullMessageHistory, model);
      }

      context.currentTokensUsed += countMessageTokens([createChatMessage('user', userInput)], model);

      while (context.nextMessageToAddIndex >=0) {
        const messageToAdd = fullMessageHistory[context.nextMessageToAddIndex];
        const tokensToAdd = countMessageTokens([ messageToAdd ], model);
        if (context.currentTokensUsed + tokensToAdd > sendTokenLimit) {
          break;
        }
        context.currentContext.splice(context.insertionIndex, 0, fullMessageHistory[context.nextMessageToAddIndex]);

        context.currentTokensUsed += tokensToAdd;
        context.nextMessageToAddIndex -= 1;
      }

      context.currentContext.push(createChatMessage('user', userInput));

      for (const plugin of Config.plugins) {
        // TODO: plugins...
        /**
                if not plugin.can_handle_on_planning():
                    continue
                plugin_response = plugin.on_planning(
                    agent.prompt_generator, current_context
                )
                if not plugin_response or plugin_response == "":
                    continue
                tokens_to_add = token_counter.count_message_tokens(
                    [create_chat_message("system", plugin_response)], model
                )
                if current_tokens_used + tokens_to_add > send_token_limit:
                    if cfg.debug_mode:
                        print("Plugin response too long, skipping:", plugin_response)
                        print("Plugins remaining at stop:", plugin_count - i)
                    break
                current_context.append(create_chat_message("system", plugin_response))
         */
      }

      const tokensRemaining = tokenLimit - context.currentTokensUsed;

      const debug = true;
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
function generateContext (prompt: string, relevantMemory: string[], fullMessageHistory: Message[], model: Model) {
  const currentContext = [
    createChatMessage('system', prompt),
    createChatMessage('system', `The current time and date is ${(new Date()).toLocaleString()}`),
  ];

  if (relevantMemory.length) {
    currentContext.push(
      createChatMessage('system', `This reminds you of these events from your past:\n${relevantMemory}\n\n`),
    );
  }

  return {
    nextMessageToAddIndex: fullMessageHistory.length - 1,
    currentTokensUsed: countMessageTokens(currentContext, model),
    insertionIndex: currentContext.length,
    currentContext,
  };
}