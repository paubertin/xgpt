import tiktoken from '@dqbd/tiktoken';
import { Message, Model } from './openai';
import { NotImplementedError } from '@d4c/numjs/build/main/lib/errors';

/**
 * Returns the number of tokens used by a list of messages.
 */
export function countMessageTokens (messages: Message[], model: Model = 'gpt-3.5-turbo-0301'): number {
  let encoding: tiktoken.Tiktoken;
  let tokensPerMessage: number;
  let tokensPerName: number;
  try {
    encoding = tiktoken.encoding_for_model(model);
  }
  catch (_) {
    console.warn("Warning: model not found. Using cl100k_base encoding.")
    encoding = tiktoken.get_encoding('cl100k_base');
  }
  switch (model) {
    case 'gpt-3.5-turbo': {
      return countMessageTokens(messages, 'gpt-3.5-turbo-0301');
    }
    case 'gpt-3.5-turbo-0301': {
      tokensPerMessage = 4;
      tokensPerName = -1;
      break;
    }
    case 'gpt-4': {
      return countMessageTokens(messages, 'gpt-4-0314');
    }
    case 'gpt-4-0314': {
      tokensPerMessage = 3;
      tokensPerName = 1;
      break;
    }
    default: {
      throw new NotImplementedError(`countMessageTokens is not implemented for model ${model}`);
    }
  }
  let numTokens = 0;
  for (const message of messages) {
    numTokens += tokensPerMessage;
    Object.entries(message).forEach((entry) => {
      numTokens += encoding.encode(entry[1]).length;
      if (entry[0] === 'name') {
        numTokens += tokensPerName;
      }
    });
  }
  numTokens += 3;
  return numTokens;
}