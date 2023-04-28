import { Config } from "./config";
import { Logger } from "./logger";
import { Message, Model, OpenAI } from "./openai";
import * as openai from 'openai';
import { sleepAsync } from "./sleep";

export async function callAIFunction (func: string, args: any[], desc: string, model: Model = Config.smartLLMModel) {
  args = args.map((arg) => arg !== null && arg !== undefined ? `${String(arg)}` : 'None');
  const argsString = args.join(', ');
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are the following Typescript function:
\`\`\`
/**
 * ${desc}
  */
${func}
\`\`\`

Only respond with your \`return\` value.`
    },
    {
      role: 'user',
      content: argsString,
    }
  ];
  return await createChatCompletion(messages, model, 0);
}
/**
 * ${desc}
 */

/**
 * regergerg
 ergreger
 */
export async function createChatCompletion (
  messages: Message[],
  model: string,
  temperature = Config.temperature,
  maxTokens?: number) {

  let response: openai.CreateChatCompletionResponse  | undefined = undefined;
  const numRetries = 10;
  let warnedUser = false;

  if (Config.debugMode) {
    Logger.status(`Creating chat completion with model ${model}, temperature ${temperature}, max tokens ${maxTokens}`);
  }

  for (let attempt = 1; attempt <= numRetries; ++attempt) {
    const backoff = 2 ** (attempt + 2);
    try {
      response = (await OpenAI.instance.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })).data;
    }
    catch (err: any) {
      console.error(err.message);
    }
    if (response) {
      break;
    }
    await sleepAsync(backoff * 1000);
  }
  if (!response || !response.choices[0].message?.content) {
    console.error('Failed to get response');

    if (Config.debugMode) {
      throw new Error(`Failed to get response after ${numRetries} retries`);
    }
    else {
      process.exit(1);
    }
  }

  return response.choices[0].message.content;
}

export async function createEmbedding (text: string, model: string) {
  return await OpenAI.instance.createEmbedding({
    input: [ text ],
    model,
  })
}

export async function getAdaEmbedding (text: string) {
  const model = 'text-embedding-ada-002';
  text = text.replaceAll('\n', ' ');
  const embedding = await createEmbedding(text, model);
  
  return embedding.data.data[0].embedding;
}

export async function createEmbeddingWithAda (text: string) {
  const numRetries = 10;
  let embedding: number[] | undefined = undefined;
  for (let attempt = 1; attempt <= numRetries; ++attempt) {
    const backoff = 2 ** (attempt + 2);
    try {
      embedding = (await OpenAI.instance.createEmbedding({
        input: [ text ],
        model: 'text-embedding-ada-002',
      })).data.data[0].embedding;
    }
    catch (err: any) {
      console.error(err);
    }
    if (embedding) {
      break;
    }
    await sleepAsync(backoff * 1000);
  }
  if (!embedding) {
    console.error('Failed to get embedding');

    if (Config.debugMode) {
      throw new Error(`Failed to get embedding after ${numRetries} retries`);
    }
    else {
      process.exit(1);
    }
  }
  return embedding;
}