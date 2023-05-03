import { IAgent } from "../interfaces.js";
import { createChatCompletion } from "../llm.utils.js";
import { Message } from "../openai.js";


/**
 * Agent manager for managing GPT agents
 */
export class AgentManager {

  public static init () {
    if (this._initialized) {
      return;
    }
    this._instance = new AgentManager();
    this._instance._init();
    this._initialized = true;
    return this._instance;
  }

  /**
   * Create a new agent and return its key
   */
  public static async createAgent (task: string, prompt: string, model: string) {
    const instance = this.instance;
    const messages: Message[] = [
      {
        role: 'user',
        content: prompt,
      }
    ];

    const agentReply = await createChatCompletion(messages, model);
  
    messages.push({
      role: 'assistant',
      content: agentReply,
    });

    const key = instance.nextKey;
    instance.nextKey += 1;

    instance.agents.set(key, {
      task,
      messages,
      model,
    })

    return {
      key,
      agentReply,
    }
  }

  /**
   * Send a message to an agent and return its response
   */
  public static async messageAgent (key: number, message: string) {
    const instance = this.instance;
    const agent = instance.agents.get(key);

    if (!agent) {
      throw new Error(`Agent ${key} not found`);
    }

    agent.messages.push({
      role: 'user',
      content: message,
    });

    const agentReply = await createChatCompletion(agent.messages, agent.model);

    agent.messages.push({
      role: 'assistant',
      content: agentReply,
    });

    return agentReply;
  }

  /**
   * Return a list of all agents
   */
  public static listAgents () {
    const instance = this.instance;
    return Array.from(instance.agents.entries());
  }

  /**
   * Delete an agent from the agent manager
   */
  public static deleteAgent (key: number) {
    const instance = this.instance;
    if (!instance.agents.has(key)) {
      return false;
    }
    instance.agents.delete(key);
    return true;
  }

  public static get instance () {
    if (!this._instance) {
      throw new Error('AgentManager not initialized');
    }
    return this._instance;
  }

  private constructor () {

  }

  private _init () {
  }

  private static _instance: AgentManager | undefined = undefined;
  private static _initialized: boolean = false;

  private nextKey = 0;
  private agents = new Map<number, IAgent>();
}