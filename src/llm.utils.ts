import { Config } from "./config";
import { IMessage } from "./interfaces";
import { Colour, Logger } from "./logger";
import { OpenAI } from "./openai";
import * as openai from 'openai';
import { sleepAsync } from "./sleep";

export async function createChatCompletion (
  messages: IMessage[],
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
      console.error(err);
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