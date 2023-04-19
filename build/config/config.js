"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const dotenv = __importStar(require("dotenv"));
const logger_1 = require("../logger");
class Config {
    static init() {
        if (this._initialized) {
            return;
        }
        this._instance = new Config();
        dotenv.config();
        this._instance._init();
        this._initialized = true;
        return this._instance;
    }
    _init() {
    }
    static get instance() {
        if (!this._instance) {
            throw new Error('Config not initialized');
        }
        return this._instance;
    }
    /**
     * Check if the OpenAI API key is set in config or as an environment variable.
     */
    static checkOpenAIAPIKey() {
        var _a;
        if (!((_a = this._instance) === null || _a === void 0 ? void 0 : _a.openAIAPIKey)) {
            logger_1.Logger.error('Please set your OpenAI API key in .env or as environment variable.', 12, 'cuou');
            logger_1.Logger.error('You can get your key from https://platform.openai.com/account/api-keys');
            process.exit(1);
        }
    }
    constructor() {
        this.debugMode = false;
        this.continuousMode = false;
        this.continuousLimit = 0;
        this.speakMode = false;
        this.skipReprompt = false;
        this.allowDownloads = false;
        this.seleniumWebBrowser = this.getEnv('USE_WEB_BROWSER', 'chrome');
        this.aiSettingsFile = this.getEnv('AI_SETTINGS_FILE', 'ai_settings.yaml');
        this.fastLLMModel = this.getEnv('FAST_LLM_MODEL', 'gpt-3.5-turbo');
        this.smartLLMModel = this.getEnv('SMART_LLM_MODEL', 'gpt-4');
        this.fastTokenLimit = this.getEnv('FAST_TOKEN_LIMIT', 4000);
        this.smartTokenLimit = this.getEnv('SMART_TOKEN_LIMIT', 8000);
        this.browseChunkMaxLength = this.getEnv('BROWSE_CHUNK_MAX_LENGTH', 8192);
        this.openAIAPIKey = this.getEnv('OPENAI_API_KEY');
        this.temperature = this.getEnv('TEMPERATURE', 1);
        this.executeLocalCommands = this.getEnv('EXECUTE_LOCAL_COMMANDS', false);
    }
    getEnv(key, def) {
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
                return envValue !== null && envValue !== void 0 ? envValue : def;
            }
        }
        else {
            return envValue !== null && envValue !== void 0 ? envValue : undefined;
        }
    }
}
Config._instance = undefined;
Config._initialized = false;
exports.Config = Config;
