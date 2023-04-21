import { chatWithAI } from "../chat";
import { Config } from "../config";

export class Agent {

  public constructor (
    public name: string,
    public memory: string,
    public messages: string[],
    public nextActionCount: number,
    public systemPrompt: string,
    public triggeringPrompt: string,
  ) {}

  public async startInteractionLoop() {
    let loopCount = 0;
    let commandName: string | undefined = undefined;
    let args: any[] | undefined = undefined;
    let userInput: string = '';

    while (true) {
      loopCount += 1;

      if (Config.continuousMode && Config.continuousLimit > 0 && loopCount > Config.continuousLimit) {
        console.error('Continuous limit reached');
        break;
      }

      const assistantReply = await chatWithAI(this.systemPrompt, this.triggeringPrompt, this.messages, this.memory, Config.fastTokenLimit);
      const assistantReplyJson = fixJsonUsingMultipleTechniques(assistantReply);
    }
  }

}