export interface IMessage {
  role: 'assistant' | 'user';
  content: string;
}

export interface IAgent {
  task: any;
  messages: IMessage[];
  model: any;
}