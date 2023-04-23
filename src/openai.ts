import * as openai from 'openai';
import tiktoken from '@dqbd/tiktoken';
import { Config } from './config';

export type Model = tiktoken.TiktokenModel;
export type Message = openai.ChatCompletionRequestMessage;
export type Role = openai.ChatCompletionRequestMessageRoleEnum;

export class OpenAI extends openai.OpenAIApi {

  public static init () {
    if (this._initialized) {
      return;
    }
    const configuration = new openai.Configuration({ apiKey: Config.openAIAPIKey });
    this._instance = new openai.OpenAIApi(configuration);
    this._initialized = true;
    return this._instance;
  }

  public static get instance () {
    if (!this._instance) {
      console.error('OpenAI not initialized');
      process.exit(1);
    }
    return this._instance;
  }

  private constructor () {
    super();
  }

  private _api: openai.OpenAIApi | undefined = undefined;
  private static _instance: openai.OpenAIApi | undefined = undefined;
  private static _initialized: boolean = false;

}