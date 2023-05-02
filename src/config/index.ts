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
      Logger.error('Please set your OpenAI API key in .env or as environment variable.');
      Logger.error('You can get your key from https://platform.openai.com/account/api-keys');
      throw new Error('OpenAPI key not found');
    }
  }

  public static get (key: keyof Config) {
    const instance = this.instance;
    return instance[key];
  }

  public static get logsDirectory () { return this.instance.logsDirectory; }
  public static get debugMode () { return this.instance.debugMode; }
  public static get continuousMode () { return this.instance.continuousMode; }
  public static get continuousLimit () { return this.instance.continuousLimit; }
  public static get speakMode () { return this.instance.speakMode; }
  public static get skipReprompt () { return this.instance.skipReprompt; }
  public static get allowDownloads () { return this.instance.allowDownloads; }
  public static get aiSettingsFile () { return this.instance.aiSettingsFile; }
  public static get fastLLMModel () { return this.instance.fastLLMModel; }
  public static get smartLLMModel () { return this.instance.smartLLMModel; }
  public static get fastTokenLimit () { return this.instance.fastTokenLimit; }
  public static get smartTokenLimit () { return this.instance.smartTokenLimit; }
  public static get browseChunkMaxLength () { return this.instance.browseChunkMaxLength; }
  public static get browseSpacyLanguageModel () { return this.instance.browseSpacyLanguageModel; }
  public static get openAIAPIKey () { return this.instance.openAIAPIKey; }
  public static get temperature () { return this.instance.temperature; }
  public static get executeLocalCommands () { return this.instance.executeLocalCommands; }
  public static get memoryBackend () { return this.instance.memoryBackend; }
  public static get memoryIndex () { return this.instance.memoryIndex; }
  public static get plugins () { return this.instance.plugins; }
  public static get googleApiKey () { return this.instance.googleApiKey; }
  public static get customSearchEngineId () { return this.instance.customSearchEngineId; }
  public static get restrictToWorkspace () { return this.instance.restrictToWorkspace; }
  public static get useWeaviateEmbedded () { return this.instance.useWeaviateEmbedded; }
  public static get weaviateHost () { return this.instance.weaviateHost; }
  public static get weaviatePort () { return this.instance.weaviatePort; }
  public static get weaviateProtocol () { return this.instance.weaviateProtocol; }
  public static get weaviateUserName () { return this.instance.weaviateUserName; }
  public static get weaviatePassword () { return this.instance.weaviatePassword; }
  public static get weaviateAPIKey () { return this.instance.weaviateAPIKey; }
  
  public static get workspacePath () {
    const res = this.instance.workspacePath;
    if (!res) { throw new Error('workspacePath has ot been set') }
    return res;
  }

  public static set workspacePath (p: string) { this.instance.workspacePath = p; }

  public static get fileLoggerPath () {
    const res = this.instance.fileLoggerPath;
    if (!res) { throw new Error('fileLoggerPath has ot been set') }
    return res;
  }

  public static set fileLoggerPath (p: string) { this.instance.fileLoggerPath = p; }

  private constructor () {
    this.debugMode = false;
    this.continuousMode = false;
    this.continuousLimit = 0;
    this.speakMode = false;
    this.skipReprompt = false;
    this.allowDownloads = false;

    this.logsDirectory = this.getEnv('LOGS_DIRECTORY');
    this.aiSettingsFile = this.getEnv('AI_SETTINGS_FILE', 'ai_settings.json');
    this.fastLLMModel = this.getEnv('FAST_LLM_MODEL', 'gpt-3.5-turbo');
    this.smartLLMModel = this.getEnv('SMART_LLM_MODEL', 'gpt-4');
    this.fastTokenLimit = this.getEnv('FAST_TOKEN_LIMIT', 4000);
    this.smartTokenLimit = this.getEnv('SMART_TOKEN_LIMIT', 8000);
    this.browseChunkMaxLength = this.getEnv('BROWSE_CHUNK_MAX_LENGTH', 3000);
    this.browseSpacyLanguageModel = this.getEnv('BROWSE_SPACY_LANGUAGE_MODEL', 'en_core_web_sm');

    this.openAIAPIKey = this.getEnv('OPENAI_API_KEY');
    this.temperature = this.getEnv('TEMPERATURE', 1);
    this.executeLocalCommands = this.getEnv('EXECUTE_LOCAL_COMMANDS', false);

    this.memoryBackend = this.getEnv('MEMORY_BACKEND', 'local');
    this.memoryIndex = this.getEnv('MEMORY_INDEX', 'x-gpt');
    this.useWeaviateEmbedded = this.getEnv('USE_WEAVIATE_EMBEDDED', false);
    this.weaviateHost = this.getEnv('WEAVIATE_HOST', 'localhost');
    this.weaviatePort = this.getEnv('WEAVIATE_PORT', 6666);
    this.weaviateProtocol = this.getEnv('WEAVIATE_PROTOCOL', 'http');
    this.weaviateUserName = this.getEnv('WEAVIATE_USERNAME');
    this.weaviatePassword = this.getEnv('WEAVIATE_PASSWORD');
    this.weaviateAPIKey = this.getEnv('WEAVIATE_API_KEY');
    
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
          return envValue !== 'true' ? false : true;
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

  private logsDirectory?: string;
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
  private useWeaviateEmbedded: boolean;
  private weaviateHost: string;
  private weaviatePort?: number;
  private weaviateProtocol: string;
  private weaviateUserName?: string;
  private weaviatePassword?: string;
  private weaviateAPIKey?: string;


  private googleApiKey?: string;
  private customSearchEngineId?: string;
  private plugins: XGPTPlugin[] = [];
  private restrictToWorkspace: boolean;

  private workspacePath?: string;
  private fileLoggerPath?: string;
}
