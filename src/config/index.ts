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
    this._init(options);
    this._initialized = true;
  }

  private static _init (options?: ConfigOptions) {
    this._debugMode = false;
    this._smartLinksParsing = false;
    this._continuousMode = false;
    this._speakMode = false;
    this._skipReprompt = false;
    this._allowDownloads = false;

    this._continuousLimit = 0;

    this._authorizeKey = this.getEnv('AUTHORISE_COMMAND_KEY', 'y');
    this._exitKey = this.getEnv('EXIT_KEY', 'n');
    this._aiSettingsFile = this.getEnv('AI_SETTINGS_FILE', 'ai_settings.json');
    this._fastLLMModel = this.getEnv('FAST_LLM_MODEL', 'gpt-3.5-turbo');
    this._smartLLMModel = this.getEnv('SMART_LLM_MODEL', 'gpt-4');
    this._fastTokenLimit = this.getEnv('FAST_TOKEN_LIMIT', 4000);
    this._smartTokenLimit = this.getEnv('SMART_TOKEN_LIMIT', 8000);
    this._embeddingModel = this.getEnv('EMBEDDING_MODEL', 'text-embedding-ada-002');
    this._embeddingTokenizer = this.getEnv('EMBEDDING_TOKENIZER', 'cl100k_base');
    this._embeddingTokenLimit = this.getEnv('EMBEDDING_TOKEN_LIMIT', 8191);
    this._browseChunkMaxLength = this.getEnv('BROWSE_CHUNK_MAX_LENGTH', 3000);
    this._browseSpacyLanguageModel = this.getEnv('BROWSE_SPACY_LANGUAGE_MODEL', 'en_core_web_sm');

    this._openAIAPIKey = this.getEnv('OPENAI_API_KEY');
    this._temperature = this.getEnv('TEMPERATURE', 0);
    this._executeLocalCommands = this.getEnv('EXECUTE_LOCAL_COMMANDS', false);
    this._restrictToWorkspace = this.getEnv('RESTRICT_TO_WORKSPACE', true);

    this._googleApiKey = this.getEnv('GOOGLE_API_KEY');
    this._customSearchEngineId = this.getEnv('CUSTOM_SEARCH_ENGINE_ID');

    this._weaviateHost = this.getEnv('WEAVIATE_HOST', 'localhost');
    this._weaviatePort = this.getEnv('WEAVIATE_PORT', 6666);
    this._weaviateProtocol = this.getEnv('WEAVIATE_PROTOCOL', 'http');
    this._weaviateUserName = this.getEnv('WEAVIATE_USERNAME');
    this._weaviatePassword = this.getEnv('WEAVIATE_PASSWORD');
    this._weaviateAPIKey = this.getEnv('WEAVIATE_API_KEY');
    this._useWeaviateEmbedded = this.getEnv('USE_WEAVIATE_EMBEDDED', false);

    this._memoryBackend = this.getEnv('MEMORY_BACKEND', 'local');
    this._memoryIndex = this.getEnv('MEMORY_INDEX', 'auto-gpt');

    this._workspaceDirectory = this.getEnv('WORKSPACE_DIRECTORY', path.join(process.cwd(), 'auto_gpt_workspace'));

    if (options?.debug) {
      Logger.type('Debug mode: ', Color.green, 'ENABLED');
      this._debugMode = true;
    }

    if (options?.continuous) {
      Logger.type('Continuous mode: ', Color.red, 'ENABLED');
      Logger.type('Warning: ', Color.red, 'Continuous mode is not recommended. It is potentially dangerous and may'
      + ' cause your AI to run forever or carry out actions you would not usually'
      + ' authorise. Use at your own risk.');
      this._continuousMode = true;

      if (options.continuous_limit) {
        Logger.type('Continuous limit: ', Color.green, options.continuous_limit);
        this._continuousLimit = options.continuous_limit;
      }
    }

    if (options?.continuous_limit !== undefined && !options.continuous) {
      throw new Error('--continuous_limit can only be used with --continuous');
    }

    if (options?.speak) {
      Logger.type('Speak mode: ', Color.green, 'ENABLED');
      this._speakMode = true;
    }

    if (options?.gpt3only) {
      Logger.type('GPT3.5 only mode: ', Color.green, 'ENABLED');
      this._smartLLMModel = this._fastLLMModel;
    }

    if (options?.gpt4only) {
      Logger.type('GPT4 only mode: ', Color.green, 'ENABLED');
      this._fastLLMModel = this._smartLLMModel;
    }

    if (options?.use_memory) {
      if (!SUPPORTED_MEMORIES.includes(options.use_memory)) {
        Logger.type('ONLY THE FOLLOWING MEMORIES BACKENDS ARE SUPPORTED: ', Color.red, SUPPORTED_MEMORIES);
        Logger.type('Defaulting to: ', Color.yellow, this._memoryBackend);
      }
      else {
        this._memoryBackend = options.use_memory;
      }
    }

    if (options?.skip_reprompt) {
      Logger.type('Skip re-prompt: ', Color.green, 'ENABLED');
      this._skipReprompt = true;
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
      this._aiSettingsFile = options.ai_settings;
      this._skipReprompt = true;
    }

    if (options?.allow_downloads) {
      Logger.type('Native downloading: ', Color.green, 'ENABLED');
      Logger.type('WARNING: ', Color.yellow, 'Auto-GPT will now be able to download and save files to your machine. It is recommended that you monitor any files it downloads carefully.');
      Logger.type('WARNING: ', Color.yellow, 'ALWAYS REMEMBER TO NEVER OPEN FILES YOU AREN\'T SURE OF!');
      this._allowDownloads = true;
    }
  }

  /**
   * Check if the OpenAI API key is set in config or as an environment variable.
   */
  public static checkOpenAIAPIKey () {
    if (!this._openAIAPIKey) {
      Logger.print(Color.red, 'Please set your OpenAI API key in .env or as environment variable.');
      Logger.print('You can get your key from https://platform.openai.com/account/api-keys');
      throw new AutoGPTError('OpenAPI key not found', () => process.exit(1));
    }
  }

  private static checkInitialized () {
    if (!this._initialized) {
      throw new AutoGPTError('Config not initialized', () => process.exit(1));
    }
  }

  public static get debugMode () { this.checkInitialized(); return this._debugMode; }
  public static get smartLinksParsing () { this.checkInitialized(); return this._smartLinksParsing; }
  public static get continuousMode () { this.checkInitialized(); return this._continuousMode; }
  public static get continuousLimit () { this.checkInitialized(); return this._continuousLimit; }
  public static get speakMode () { this.checkInitialized(); return this._speakMode; }
  public static get skipReprompt () { this.checkInitialized(); return this._skipReprompt; }
  public static get allowDownloads () { this.checkInitialized(); return this._allowDownloads; }
  public static get aiSettingsFile () { this.checkInitialized(); return this._aiSettingsFile; }
  public static get fastLLMModel () { this.checkInitialized(); return this._fastLLMModel; }
  public static get smartLLMModel () { this.checkInitialized(); return this._smartLLMModel; }
  public static get fastTokenLimit () { this.checkInitialized(); return this._fastTokenLimit; }
  public static get smartTokenLimit () { this.checkInitialized(); return this._smartTokenLimit; }
  public static get browseChunkMaxLength () { this.checkInitialized(); return this._browseChunkMaxLength; }
  public static get browseSpacyLanguageModel () { this.checkInitialized(); return this._browseSpacyLanguageModel; }
  public static get openAIAPIKey () { this.checkInitialized(); return this._openAIAPIKey; }
  public static get temperature () { this.checkInitialized(); return this._temperature; }
  public static get executeLocalCommands () { this.checkInitialized(); return this._executeLocalCommands; }
  public static get memoryBackend () { this.checkInitialized(); return this._memoryBackend; }
  public static get memoryIndex () { this.checkInitialized(); return this._memoryIndex; }
  public static get googleApiKey () { this.checkInitialized(); return this._googleApiKey; }
  public static get customSearchEngineId () { this.checkInitialized(); return this._customSearchEngineId; }
  public static get restrictToWorkspace () { this.checkInitialized(); return this._restrictToWorkspace; }
  public static get useWeaviateEmbedded () { this.checkInitialized(); return this._useWeaviateEmbedded; }
  public static get weaviateHost () { this.checkInitialized(); return this._weaviateHost; }
  public static get weaviatePort () { this.checkInitialized(); return this._weaviatePort; }
  public static get weaviateProtocol () { this.checkInitialized(); return this._weaviateProtocol; }
  public static get weaviateUserName () { this.checkInitialized(); return this._weaviateUserName; }
  public static get weaviatePassword () { this.checkInitialized(); return this._weaviatePassword; }
  public static get weaviateAPIKey () { this.checkInitialized(); return this._weaviateAPIKey; }
  
  
  public static get authorizeKey () { this.checkInitialized(); return this._authorizeKey; }
  public static get exitKey () { this.checkInitialized(); return this._exitKey; }
  public static get embeddingModel () { this.checkInitialized(); return this._embeddingModel; }
  public static get embeddingTokenizer () { this.checkInitialized(); return this._embeddingTokenizer; }
  public static get embeddingTokenLimit () { this.checkInitialized(); return this._embeddingTokenLimit; }
  public static get workspaceDirectory () { this.checkInitialized(); return this._workspaceDirectory; }

  public static get fileLoggerPath () {
    this.checkInitialized();
    const res = this._fileLoggerPath;
    if (!res) { throw new Error('fileLoggerPath has ot been set') }
    return res;
  }

  public static set fileLoggerPath (p: string) { this.checkInitialized(); this._fileLoggerPath = p; }

  private constructor () {}
  
  private static getEnv<T> (key: string): T | undefined
  private static getEnv<T> (key: string, def: T): T
  private static getEnv (key: string, def?: any): any {
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

  private static _initialized: boolean = false;

  private static _debugMode: boolean;
  private static _smartLinksParsing: boolean;
  private static _continuousMode: boolean;
  private static _continuousLimit: number;
  private static _speakMode: boolean;
  private static _skipReprompt: boolean;
  private static _allowDownloads: boolean;
  private static _aiSettingsFile: string;
  private static _fastLLMModel: Model;
  private static _smartLLMModel: Model;
  private static _fastTokenLimit: number;
  private static _smartTokenLimit: number;
  private static _browseChunkMaxLength: number;
  private static _browseSpacyLanguageModel: string;
  private static _openAIAPIKey?: string;
  private static _temperature: number;
  private static _executeLocalCommands: boolean;

  private static _memoryBackend: string;
  private static _memoryIndex: string;
  private static _useWeaviateEmbedded: boolean;
  private static _weaviateHost: string;
  private static _weaviatePort?: number;
  private static _weaviateProtocol: string;
  private static _weaviateUserName?: string;
  private static _weaviatePassword?: string;
  private static _weaviateAPIKey?: string;


  private static _googleApiKey?: string;
  private static _customSearchEngineId?: string;
  private static _restrictToWorkspace: boolean;

  private static _workspaceDirectory: string;
  private static _fileLoggerPath?: string;

  private static _authorizeKey: string;
  private static _exitKey: string;
  private static _embeddingModel: string;
  private static _embeddingTokenizer: string;
  private static _embeddingTokenLimit: number;
}
