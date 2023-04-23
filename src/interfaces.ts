import { Message } from "./openai";

export interface IAgent {
  task: any;
  messages: Message[];
  model: any;
}