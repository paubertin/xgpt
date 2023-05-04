import { Config } from '../config/index.js';
import { Message, OpenAI } from '../openai.js';
import { Logger } from '../logs.js';
import { COSTS } from './modelsinfo.js';

export class ApiManager {
  private static _totalPromptTokens: number = 0;
  private static _totalCompletionTokens: number = 0;
  private static _totalCost: number = 0;
  private static _totalBudget: number = 0;

  public static reset () {
    this._totalPromptTokens = 0;
    this._totalCompletionTokens = 0;
    this._totalCost = 0;
    this._totalBudget = 0;
  }

  /**
   * Create a chat completion and update the cost.
   */
  public static async createChatCompletion (
    messages: Message[],
    model: string,
    temperature = Config.temperature,
    maxTokens?: number) {

    const response = (await OpenAI.instance.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })).data;
    
    Logger.debug(`Response: ${response}`);

    this.updateCost(response.usage?.prompt_tokens, response.usage?.completion_tokens, model);
    return response;
  }

  /**
   * Update the total cost, prompt tokens, and completion tokens.
   */
  public static updateCost (promptTokens: number = 0, completionTokens: number = 0, model: string) {
    this._totalPromptTokens += promptTokens;
    this._totalCompletionTokens += completionTokens;
    this._totalCost += (promptTokens * COSTS[model].prompt + completionTokens * COSTS[model].completion) / 1000;
    Logger.debug(`Total running cost: $${this._totalCost.toFixed(3)}`);
  }

  /**
   * Sets the total user-defined budget for API calls.
   */
  public static set totalBudget (value: number) {
    this._totalBudget = value;
  }

  /**
   * Get the total user-defined budget for API calls.
   */
  public static get totalBudget () {
    return this._totalBudget;
  }

  /**
   * Get the total number of prompt tokens.
   */
  public static get totalPromptTokens () {
    return this._totalPromptTokens;
  }

  /**
   * Get the total number of completion tokens.
   */
  public static get totalCompletionTokens () {
    return this._totalCompletionTokens;
  }

  /**
   * Get the total cost of API calls.
   */
  public static get totalCost () {
    return this._totalCost;
  }

  private constructor () {}
}