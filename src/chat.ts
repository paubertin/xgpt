import { Config } from "./config";
import { Memory } from "./memory/base";

export async function chatWithAI (prompt: string, userInput: string, messages: string[], permanentMemory: Memory, tokenLimit: number) {
  while (true) {
    try {
      const model = Config.fastLLMModel;
      const sendTokenLimit = tokenLimit - 1000;

      const relevantMemory = messages.length === 0 ? '' : permanentMemory.getRelevant(/* */, 10);
    }
    catch (err: any) {

    }
  }
}