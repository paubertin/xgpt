import { Config } from "../config/index.js";
import { Memory } from "./base.js";
import { LocalCache } from "./local.js";
import { WeaviateMemory } from "./weaviate.js";

export const SUPPORTED_MEMORIES = [
  'local',
  'no_memory',
  'weaviate',
];

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