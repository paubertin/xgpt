import * as openai from 'openai';

export class OpenAI extends openai.OpenAIApi {

  public static init (config: openai.ConfigurationParameters = {}) {
    if (this._initialized) {
      return;
    }
    const configuration = new openai.Configuration(config);
    this._instance = new openai.OpenAIApi(configuration);
    this._initialized = true;
    return this._instance;
  }

  public static get instance () {
    if (!this._instance) {
      throw new Error('OpenAI not initialized');
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