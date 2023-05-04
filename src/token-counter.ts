import nodeTikToken from 'tiktoken-node';
import { Message, Model } from './openai.js';
import { NotImplementedError } from '@d4c/numjs/build/main/lib/errors.js';
import { Python } from './python/index.js';

/**
 * Returns the number of tokens used by a list of messages.
 */
export async function countMessageTokens (messages: Message[], model: Model = 'gpt-3.5-turbo-0301') {
  return await Python.countMessageTokens(messages, model);
  /*
  let encoding: nodeTikToken.Encoding;
  let tokensPerMessage: number;
  let tokensPerName: number;
  try {
    encoding = nodeTikToken.encodingForModel(model);
  }
  catch (_) {
    console.warn("Warning: model not found. Using cl100k_base encoding.")
    encoding = nodeTikToken.getEncoding('cl100k_base');
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
  */
}

/**
 * Returns the number of tokens in a text string.
 */
export async function countStringTokens (str: string, model: Model) {
  return await Python.countStringTokens(str, model);

}