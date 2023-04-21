import { Config } from "../config";
import { Memory } from "./base";
import { LocalCache } from "./local";

export function getMemory (init: boolean = false) {
  let memory: Memory | undefined = undefined;
  const memoryBackend = Config.memoryBackend;

  memory = new LocalCache();

  if (init) {
    memory.clear();
  }

  return memory;
}