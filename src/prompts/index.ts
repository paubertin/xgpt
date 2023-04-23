import { Command } from "../commands/command";
import { Config } from "../config";
import { AIConfig } from "../config/ai.config";
import { promptUser } from "../setup";
import { PromptGenerator } from "./generator";
import readline from 'readline/promises';

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

  promptGenerator.addConstraint('Exclusively use the commands listed in double quotes e.g. "command name"');

  const commands: Command[] = [
    new Command('do_nothing', 'Do Nothing'),
    new Command('task_complete', 'Task Complete (Shutdown)', undefined, { reason: '<reason>' }),
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

  if (Config.skipReprompt && config.name) {
    console.log('Name : ', config.name);
    console.log('Role : ', config.role);
    if (config.goals.length) {
      console.log('Goals : ');
      config.goals.forEach((goal) => {
        console.log('\t', goal);
      });
    }
  }
  else if (config.name) {
    console.log(`Welcome back! Would you like me to return to being ${config.name}.`);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(config);
    const answer = await rl.question('Continue with last settings?'
    + '\n'
    + `Name:  ${config.name}`
    + '\n'
    + `Role:  ${config.role}`
    + '\n'
    + (config.goals.length ? `Goals:\n` : '')
    + (config.goals.length ? `${config.goals.map((g) => '\t. ' + g).join('\n')}\n\n` : '\n')
    + 'Continue (y/n):');
    if (answer.toLowerCase() === 'n') {
      config = new AIConfig();
    }
  }

  if (!config.name) {
    config = await promptUser();
    config.save(Config.aiSettingsFile);
  }

  return config;
}