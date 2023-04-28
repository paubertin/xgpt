import { Config } from "../config";
import { Memory } from "./base";
import { LocalCache } from "./local";
import { WeaviateMemory } from "./weaviate";

export async function getMemory (init: boolean = false) {
  let memory: Memory;
  try {
    memory = Memory.instance;
  }
  catch {
    const memoryBackend = Config.memoryBackend;
  
    switch (memoryBackend) {
      case 'weaviate': {
        memory = await Memory.init(WeaviateMemory);
        break;
      }
      case 'local':
      default: {
        memory = await Memory.init(LocalCache);
        if (init) {
          Memory.clear();
        }
        break;
      }
    }
  }

  return memory;
}