import * as dotenv from 'dotenv';
import { Logger } from '../logger';
import { XGPTPlugin } from '../plugins/plugin.template';
import { Model } from '../openai';

export class Config {

  public static init () {
    if (this._initialized) {
      return;
    }
    dotenv.config();
    this._instance = new Config();
    this._instance._init();
    this._initialized = true;
    return this._instance;
  }

  private _init () {
  }

  public static get instance () {
    if (!this._instance) {
      throw new Error('Config not initialized');
    }
    return this._instance;
  }

  /**
   * Check if the OpenAI API key is set in config or as an environment variable.
   */
  public static checkOpenAIAPIKey () {
    if (!this._instance?.openAIAPIKey) {
      Logger.error('Please set your OpenAI API key in .env or as environment variable.', 12, 'cuou');
      Logger.error('You can get your key from https://platform.openai.com/account/api-keys');
      process.exit(1);
    }
  }

  public static get (key: keyof Config) {
    const instance = this.instance;
    return instance[key];
  }

  public static get debugMode () { const instance = this.instance; return instance.debugMode; }
  public static get continuousMode () { const instance = this.instance; return instance.continuousMode; }
  public static get continuousLimit () { const instance = this.instance; return instance.continuousLimit; }
  public static get speakMode () { const instance = this.instance; return instance.speakMode; }
  public static get skipReprompt () { const instance = this.instance; return instance.skipReprompt; }
  public static get allowDownloads () { const instance = this.instance; return instance.allowDownloads; }
  public static get aiSettingsFile () { const instance = this.instance; return instance.aiSettingsFile; }
  public static get fastLLMModel () { const instance = this.instance; return instance.fastLLMModel; }
  public static get smartLLMModel () { const instance = this.instance; return instance.smartLLMModel; }
  public static get fastTokenLimit () { const instance = this.instance; return instance.fastTokenLimit; }
  public static get smartTokenLimit () { const instance = this.instance; return instance.smartTokenLimit; }
  public static get browseChunkMaxLength () { const instance = this.instance; return instance.browseChunkMaxLength; }
  public static get browseSpacyLanguageModel () { const instance = this.instance; return instance.browseSpacyLanguageModel; }
  public static get openAIAPIKey () { const instance = this.instance; return instance.openAIAPIKey; }
  public static get temperature () { const instance = this.instance; return instance.temperature; }
  public static get executeLocalCommands () { const instance = this.instance; return instance.executeLocalCommands; }
  public static get memoryBackend () { const instance = this.instance; return instance.memoryBackend; }
  public static get memoryIndex () { const instance = this.instance; return instance.memoryIndex; }
  public static get plugins () { const instance = this.instance; return instance.plugins; }
  public static get googleApiKey () { const instance = this.instance; return instance.googleApiKey; }
  public static get customSearchEngineId () { const instance = this.instance; return instance.customSearchEngineId; }
  public static get restrictToWorkspace () { const instance = this.instance; return instance.restrictToWorkspace; }

  private constructor () {
    this.debugMode = false;
    this.continuousMode = true;
    this.continuousLimit = 0;
    this.speakMode = false;
    this.skipReprompt = false;
    this.allowDownloads = false;

    this.aiSettingsFile = this.getEnv('AI_SETTINGS_FILE', 'ai_settings.json');
    this.fastLLMModel = this.getEnv('FAST_LLM_MODEL', 'gpt-3.5-turbo');
    this.smartLLMModel = this.getEnv('SMART_LLM_MODEL', 'gpt-4');
    this.fastTokenLimit = this.getEnv('FAST_TOKEN_LIMIT', 4000);
    this.smartTokenLimit = this.getEnv('SMART_TOKEN_LIMIT', 8000);
    this.browseChunkMaxLength = this.getEnv('BROWSE_CHUNK_MAX_LENGTH', 8192);
    this.browseSpacyLanguageModel = this.getEnv('BROWSE_SPACY_LANGUAGE_MODEL', 'en_core_web_sm');

    this.openAIAPIKey = this.getEnv('OPENAI_API_KEY');
    this.temperature = this.getEnv('TEMPERATURE', 1);
    this.executeLocalCommands = this.getEnv('EXECUTE_LOCAL_COMMANDS', false);

    this.memoryBackend = this.getEnv('MEMORY_BACKEND', 'local');
    this.memoryIndex = this.getEnv('MEMORY_INDEX', 'x-gpt');
    
    this.googleApiKey = this.getEnv('GOOGLE_API_KEY');
    this.customSearchEngineId = this.getEnv('CUSTOM_SEARCH_ENGINE_ID');
    this.restrictToWorkspace = this.getEnv('RESTRICT_TO_WORKSPACE', true);
  }
  
  private getEnv<T> (key: string): T | undefined
  private getEnv<T> (key: string, def: T): T
  private getEnv (key: string, def?: any): any {
    const envValue = process.env[key];
    if (def !== undefined) {
      if (typeof def === 'boolean') {
        if (envValue !== undefined) {
          return envValue === 'true' ? true : false;
        }
        else {
          return def;
        }
      }
      else if (typeof def === 'number') {
        if (envValue !== undefined) {
          return parseInt(envValue, 10);
        }
        else {
          return def;
        }
      }
      else {
        return envValue ?? def;
      }
    }
    else {
      return envValue ?? undefined;
    }
  }

  private static _instance: Config | undefined = undefined;
  private static _initialized: boolean = false;

  private debugMode: boolean;
  private continuousMode: boolean;
  private continuousLimit: number;
  private speakMode: boolean;
  private skipReprompt: boolean;
  private allowDownloads: boolean;
  private aiSettingsFile: string;
  private fastLLMModel: Model;
  private smartLLMModel: Model;
  private fastTokenLimit: number;
  private smartTokenLimit: number;
  private browseChunkMaxLength: number;
  private browseSpacyLanguageModel: string;
  private openAIAPIKey?: string;
  private temperature: number;
  private executeLocalCommands: boolean;
  private memoryBackend: string;
  private memoryIndex: string;
  private googleApiKey?: string;
  private customSearchEngineId?: string;
  private plugins: XGPTPlugin[] = [];
  private restrictToWorkspace: boolean;
}
