import { Message } from "./openai.js";

export interface IAgent {
  task: any;
  messages: Message[];
  model: any;
}