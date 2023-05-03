import * as dotenv from 'dotenv';
import { Color, Logger } from '../logs.js';
import { Model } from '../openai.js';
import { SUPPORTED_MEMORIES } from '../memory/index.js';
import fs from 'fs';
import { AutoGPTError } from '../utils.js';
import path from 'path';

export interface ConfigOptions {
  continuous?: boolean;
  skip_reprompt?: boolean;
  ai_settings?: string;
  continuous_limit?: number;
  speak?: boolean;
  debug?: boolean;
  gpt3only?: boolean;
  gpt4only?: boolean;
  use_memory?: string;
  // browser_name?: string;
  allow_downloads?: boolean;
}

export class Config {

  public static init (options?: ConfigOptions) {
    if (this._initialized) {
      return;
    }
    dotenv.config();
    this._instance = new Config();
    this._instance._init(options);
    this._initialized = true;
    return this._instance;
  }

  private _init (options?: ConfigOptions) {
    if (options?.debug) {
      Logger.type('Debug mode: ', Color.green, 'ENABLED');
      this.debugMode = true;
    }

    if (options?.continuous) {
      Logger.type('Continuous mode: ', Color.red, 'ENABLED');
      Logger.type('Warning: ', Color.red, 'Continuous mode is not recommended. It is potentially dangerous and may'
      + ' cause your AI to run forever or carry out actions you would not usually'
      + ' authorise. Use at your own risk.');
      this.continuousMode = true;

      if (options.continuous_limit) {
        Logger.type('Continuous limit: ', Color.green, options.continuous_limit);
        this.continuousLimit = options.continuous_limit;
      }
    }

    if (options?.continuous_limit !== undefined && !options.continuous) {
      throw new Error('--continuous_limit can only be used with --continuous');
    }

    if (options?.speak) {
      Logger.type('Speak mode: ', Color.green, 'ENABLED');
      this.speakMode = true;
    }

    if (options?.gpt3only) {
      Logger.type('GPT3.5 only mode: ', Color.green, 'ENABLED');
      this.smartLLMModel = this.fastLLMModel;
    }

    if (options?.gpt4only) {
      Logger.type('GPT4 only mode: ', Color.green, 'ENABLED');
      this.fastLLMModel = this.smartLLMModel;
    }

    if (options?.use_memory) {
      if (!SUPPORTED_MEMORIES.includes(options.use_memory)) {
        Logger.type('ONLY THE FOLLOWING MEMORIES BACKENDS ARE SUPPORTED: ', Color.red, SUPPORTED_MEMORIES);
        Logger.type('Defaulting to: ', Color.yellow, this.memoryBackend);
      }
      else {
        this.memoryBackend = options.use_memory;
      }
    }

    if (options?.skip_reprompt) {
      Logger.type('Skip re-prompt: ', Color.green, 'ENABLED');
      this.skipReprompt = true;
    }

    if (options?.ai_settings) {
      try {
        let fileContent = fs.readFileSync(options?.ai_settings, { encoding: 'utf-8' }).toString().trim();
        try {
          JSON.parse(fileContent);
        }
        catch (err: any) {
          throw new Error('Failed to parse file content');
        }
      }
      catch (err: any) {
        Logger.type('FAILED FILE VALIDATION', Color.red, err.message);
        throw err;
      }
      this.aiSettingsFile = options.ai_settings;
      this.skipReprompt = true;
    }

    if (options?.allow_downloads) {
      Logger.type('Native downloading: ', Color.green, 'ENABLED');
      Logger.type('WARNING: ', Color.yellow, 'Auto-GPT will now be able to download and save files to your machine. It is recommended that you monitor any files it downloads carefully.');
      Logger.type('WARNING: ', Color.yellow, 'ALWAYS REMEMBER TO NEVER OPEN FILES YOU AREN\'T SURE OF!');
      this.allowDownloads = true;
    }
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
      Logger.print(Color.red, 'Please set your OpenAI API key in .env or as environment variable.');
      Logger.print('You can get your key from https://platform.openai.com/account/api-keys');
      throw new AutoGPTError('OpenAPI key not found', () => process.exit(1));
    }
  }

  public static get (key: keyof Config) {
    const instance = this.instance;
    return instance[key];
  }

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

  
  public static get authorizeKey () { return this.instance.authorizeKey; }
  public static get exitKey () { return this.instance.exitKey; }
  public static get embeddingModel () { return this.instance.embeddingModel; }
  public static get embeddingTokenizer () { return this.instance.embeddingTokenizer; }
  public static get embeddingTokenLimit () { return this.instance.embeddingTokenLimit; }

  public static get workspaceDirectory () { return this.instance.workspaceDirectory; }

  public static get fileLoggerPath () {
    const res = this.instance.fileLoggerPath;
    if (!res) { throw new Error('fileLoggerPath has ot been set') }
    return res;
  }

  public static set fileLoggerPath (p: string) { this.instance.fileLoggerPath = p; }

  private constructor () {
    this.debugMode = false;
    this.continuousMode = false;
    this.speakMode = false;
    this.skipReprompt = false;
    this.allowDownloads = false;

    this.continuousLimit = 0;

    this.authorizeKey = this.getEnv('AUTHORISE_COMMAND_KEY', 'y');
    this.exitKey = this.getEnv('EXIT_KEY', 'n');
    this.aiSettingsFile = this.getEnv('AI_SETTINGS_FILE', 'ai_settings.json');
    this.fastLLMModel = this.getEnv('FAST_LLM_MODEL', 'gpt-3.5-turbo');
    this.smartLLMModel = this.getEnv('SMART_LLM_MODEL', 'gpt-4');
    this.fastTokenLimit = this.getEnv('FAST_TOKEN_LIMIT', 4000);
    this.smartTokenLimit = this.getEnv('SMART_TOKEN_LIMIT', 8000);
    this.embeddingModel = this.getEnv('EMBEDDING_MODEL', 'text-embedding-ada-002');
    this.embeddingTokenizer = this.getEnv('EMBEDDING_TOKENIZER', 'cl100k_base');
    this.embeddingTokenLimit = this.getEnv('EMBEDDING_TOKEN_LIMIT', 8191);
    this.browseChunkMaxLength = this.getEnv('BROWSE_CHUNK_MAX_LENGTH', 3000);
    this.browseSpacyLanguageModel = this.getEnv('BROWSE_SPACY_LANGUAGE_MODEL', 'en_core_web_sm');

    this.openAIAPIKey = this.getEnv('OPENAI_API_KEY');
    this.temperature = this.getEnv('TEMPERATURE', 0);
    this.executeLocalCommands = this.getEnv('EXECUTE_LOCAL_COMMANDS', false);
    this.restrictToWorkspace = this.getEnv('RESTRICT_TO_WORKSPACE', true);

    this.googleApiKey = this.getEnv('GOOGLE_API_KEY');
    this.customSearchEngineId = this.getEnv('CUSTOM_SEARCH_ENGINE_ID');

    this.weaviateHost = this.getEnv('WEAVIATE_HOST', 'localhost');
    this.weaviatePort = this.getEnv('WEAVIATE_PORT', 6666);
    this.weaviateProtocol = this.getEnv('WEAVIATE_PROTOCOL', 'http');
    this.weaviateUserName = this.getEnv('WEAVIATE_USERNAME');
    this.weaviatePassword = this.getEnv('WEAVIATE_PASSWORD');
    this.weaviateAPIKey = this.getEnv('WEAVIATE_API_KEY');
    this.useWeaviateEmbedded = this.getEnv('USE_WEAVIATE_EMBEDDED', false);

    this.memoryBackend = this.getEnv('MEMORY_BACKEND', 'local');
    this.memoryIndex = this.getEnv('MEMORY_INDEX', 'auto-gpt');

    this.workspaceDirectory = this.getEnv('WORKSPACE_DIRECTORY', path.join(process.cwd(), 'auto_gpt_workspace'));
    
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
  private restrictToWorkspace: boolean;

  private workspaceDirectory: string;
  private fileLoggerPath?: string;

  private authorizeKey: string;
  private exitKey: string;
  private embeddingModel: string;
  private embeddingTokenizer: string;
  private embeddingTokenLimit: number;
}
