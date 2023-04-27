import { PromptGenerator } from "../prompts/generator";
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Config } from ".";
import { buildDefaultPromptGenerator } from "../prompts";
import { CommandRegistry } from "../commands/registry";

const SAVE_FILE = path.join(process.cwd(), 'ai_settings.json');

/**
 * A class object that contains the configuration information for the AI
 */
export class AIConfig {
  public goals: string[];
  public name: string;
  public role: string;
  public apiBudget: number;
  public promptGenerator!: PromptGenerator;
  public commandRegistry?: CommandRegistry;

  public constructor (name: string = '', role: string = '', goals?: string[], budget?: number) {
    this.name = name;
    this.role = role;
    this.goals = goals ?? [];
    this.apiBudget = budget ?? 0.0;
  }

  /**
   * Returns class object with parameters (name, role, goals) loaded from json file if json file exists, else returns class with no parameters.
   */
  public static load (configFile: string = SAVE_FILE) {
    let data: { name?: string; role?: string; goals?: string[]; apiBudget?: number } = {};
    if (fs.existsSync(configFile)) {
      try {
        let fileContent = fs.readFileSync(configFile, { encoding: 'utf-8' }).toString().trim();
        if (fileContent) {
          try {
            data = JSON.parse(fileContent);
          }
          catch (err: any) {
            throw new Error('Failed to parse file content');
          }
        }
      }
      catch (err: any) {
        console.error('Failed to open/read ai config file');
      }
    }

    return new AIConfig(data.name, data.role, data.goals, data.apiBudget);
  }

  /**
   * Saves the class parameters to the specified file json file path as a json file.
   */
  public save (configFile: string = SAVE_FILE) {
    fs.writeFileSync(configFile, JSON.stringify({ name: this.name, role: this.role, goals: this.goals, apiBudget: this.apiBudget }), { encoding: 'utf-8', flag: 'w' });
  }

  /**
   * Returns a prompt to the user with the class information in an organized fashion.
   */
  public constructFullPrompt (promptGenerator?: PromptGenerator) {
    let promptStart = 
    "Your decisions must always be made independently without\n"
    + " seeking user assistance. Play to your strengths as an LLM and pursue\n"
    + " simple strategies with no legal complications.\n"

    if (!promptGenerator) {
      promptGenerator = buildDefaultPromptGenerator();
    }

    promptGenerator.goals = this.goals;
    promptGenerator.name = this.name;
    promptGenerator.role = this.role;
    promptGenerator.commandRegistry = this.commandRegistry;

    for (const plugin of Config.plugins) {
      if (plugin.canHandlePostPrompt()) {
        promptGenerator = plugin.postPrompt(promptGenerator);
      }
    }

    if (Config.executeLocalCommands) {
      const osType = os.type();
      const osVersion = os.version();
      const osPlatform = os.platform();
      const osArch = os.arch();
      const osRelease = os.release();
      promptStart += `
The OS you are running on is:
  - ${osType} (${osPlatform})
  - Version ${osVersion}
  - Release ${osRelease}
  - Architecture: ${osArch}\n\n`;
    }

    let fullPrompt = `You are ${promptGenerator.name}, ${promptGenerator.role}\n${promptStart}\n\nGOALS:\n\n`

    this.goals.forEach((goal, idx) => {
      fullPrompt += `${idx + 1}. ${goal}\n`;
    });

    if (this.apiBudget > 0.0) {
      fullPrompt += `\nIt taks maney to let you run. Your API budget is $${this.apiBudget}`;
    }

    this.promptGenerator = promptGenerator;
    fullPrompt += `\n${promptGenerator.generatePromptString()}`
    return fullPrompt;
  }

}