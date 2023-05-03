import { AgentManager } from "../agent/agent.manager.js";
import { Config } from "../config/index.js";

function isValidInt (value: string) {
  const res = parseInt(value, 10);
  return !isNaN(res);
}

export async function startAgent (name: string, task: string, prompt: string, model: string = Config.fastLLMModel) {
  const voiceName = name.replaceAll('_', ' ');
  const firstMessage = `You are ${voiceName}. Respond with 'Acknoledged'.`;
  const agentIntro = `${voiceName} here. Reporting for duty!`;

  const { key, agentReply } = await AgentManager.createAgent(task, firstMessage, model);
  const agentResponse = await AgentManager.messageAgent(key, prompt);

  return `Agent ${name} created with key ${key}. First response: ${agentResponse}`;
}

export async function messageAgent (key: string, message: string) {
  if (isValidInt(key)) {
    try {
      return await AgentManager.messageAgent(parseInt(key, 10), message);
    }
    catch (err: any) {
      return err.message;
    }
  }
  else {
    return 'Invalid key, must be an integer';
  }
}

export async function listAgents () {
  const list = AgentManager.listAgents();
  return `List of agents:\n${list.map((tuple) => `${tuple[0]}: ${tuple[1]}`).join('\n')}`;
}

export async function deleteAgent (key: string) {
  if (isValidInt(key)) {
    const res = AgentManager.deleteAgent(parseInt(key, 10));
    return res ? `Agent ${key} deleted.` : `Agent ${key} does not exist.`;
  }
  else {
    return 'Invalid key, must be an integer';
  }
}