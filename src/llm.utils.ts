import { Config } from "./config/config";
import { IMessage } from "./interfaces";
import { Colour, Logger } from "./logger";
import { OpenAI } from "./openai";
import * as openai from 'openai';

export async function createChatCompletion (
  messages: IMessage[],
  model: string,
  temperature = Config.temperature,
  maxTokens?: number) {

  let response: openai.CreateChatCompletionResponse;
  const numRetries = 10;
  let warnedUser = false;

  if (Config.debugMode) {
    Logger.status(`Creating chat completion with model ${model}, temperature ${temperature}, max tokens ${maxTokens}`);
  }

  for (let i = 0; i < numRetries; ++i) {
    const backoff = 2 ** (i + 2);
    try {

      response = (await OpenAI.instance.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })).data;
    }
    catch (err: any) {

    }
  }
}