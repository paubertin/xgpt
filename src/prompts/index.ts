import { Command } from "../commands/command.js";
import { Config } from "../config/index.js";
import { AIConfig } from "../config/ai.config.js";
import { ApiManager } from "../llm/apiManager.js";
import { Color, Logger } from "../logs.js";
import { promptUser } from "../setup.js";
import { cleanInput } from "../utils.js";
import { PromptGenerator } from "./generator.js";

export const DEFAULT_TRIGGERING_PROMPT = 'Determine which next command to use, and respond using the format specified above:';

/**
 * This function generates a prompt string that includes various constraints, commands, resources, and performance evaluations.
 */
export function buildDefaultPromptGenerator () {
  const promptGenerator = new PromptGenerator();

  promptGenerator.addConstraint(
    '~4000 word limit for short term memory. Your short term memory is short, so'
    + ' immediately save important information to files.');

  promptGenerator.addConstraint(
    'If you are unsure how you previously did something or want to recall past'
    + ' events, thinking about similar events will help you remember.'
  );

  promptGenerator.addConstraint('No user assistance');

  promptGenerator.addConstraint('Exclusively use the commands listed in double quotes e.g. "commandName"');

  const commands: Command[] = [
    // new Command('doNothing', 'Do Nothing'),
    new Command('taskComplete', 'Task Complete (Shutdown)', undefined, { reason: 'reason' }),
  ];

  commands.forEach((command) => {
    promptGenerator.addCommand(command);
  });

  promptGenerator.addResource('Internet access for searches and information gathering.');
  promptGenerator.addResource('Long Term memory management.');
  promptGenerator.addResource('GPT-3.5 powered Agents for delegation of simple tasks.');
  promptGenerator.addResource('File output.');

  promptGenerator.addPerformanceEvaluation('Continuously review and analyze your actions to ensure you are performing to the best of your abilities.');
  promptGenerator.addPerformanceEvaluation('Constructively self-criticize your big-picture behavior constantly.');
  promptGenerator.addPerformanceEvaluation('Reflect on past decisions and strategies to refine your approach.');
  promptGenerator.addPerformanceEvaluation('Every command has a cost, so be smart and efficient. Aim to complete tasks in the least number of steps.');
  promptGenerator.addPerformanceEvaluation('Write all code to a file.');

  return promptGenerator;
}

/**
 * Construct the prompt for the AI to respond to
 */
export async function constructMainAIConfig () {
  let config = AIConfig.load(Config.aiSettingsFile);

  if (Config.skipReprompt && config.aiName) {
    Logger.type('Name: ', Color.green, config.aiName);
    Logger.type('Role: ', Color.green, config.role);
    if (config.goals.length) {
      Logger.type('Goals: \n', Color.green, config.goals.map((goal) => `\t${goal}`));
    }
  }
  else if (config.aiName) {
    Logger.type('Welcome back! ', Color.green, `Would you like me to return to being ${config.aiName}?`);
    const answer = await cleanInput('Continue with last settings?'
    + '\n'
    + `Name:  ${config.aiName}`
    + '\n'
    + `Role:  ${config.role}`
    + '\n'
    + (config.goals.length ? `Goals:\n` : '')
    + (config.goals.length ? `${config.goals.map((g) => '\t. ' + g).join('\n')}\n` : '')
    + `API Budget: ${config.apiBudget <= 0 ? 'infinite' : `$${config.apiBudget}`}\n\n`
    + `Continue (${Config.authorizeKey}/${Config.exitKey}):`);
    if (answer.toLowerCase() === Config.exitKey) {
      config = new AIConfig();
    }
  }

  if (!config.aiName) {
    config = await promptUser();
    config.save(Config.aiSettingsFile);
  }

  ApiManager.totalBudget = config.apiBudget;

  Logger.type(config.aiName, Color.cyan, ' has been created with the following details:');
  Logger.type('  Name: ', Color.green, config.aiName);
  Logger.type('  Role: ', Color.green, config.role);
  Logger.type('  Goals:\n', Color.green, config.goals.map((goal) => `\t${goal}`));
  return config;
}