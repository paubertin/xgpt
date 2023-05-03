import { AIConfig } from './config/ai.config.js';
import { Message } from './openai.js';
import { createChatCompletion } from './llm.utils.js';
import { Config } from './config/index.js';
import { Color, Logger } from './logs.js';
import { cleanInput } from './utils.js';

/**
 * Prompt the user for input
 */
export async function promptUser () {
  Logger.type('Welcome to Auto-GPT! ', Color.green, 'run with \'--help\' for more informations.');
  Logger.type('Create an AI assistant:', Color.green, 'input \'--manual\' to enter manual mode.');

  let userDesire = await cleanInput('I want X-GPT to: ', Color.cyan);

  if (userDesire === '') {
    userDesire = 'Write a wikipedia style article about the project: https://github.com/paubertin/Auto-GPT-node'
  }

  if (userDesire.includes('--manual')) {
    Logger.type('Manual mode selected', Color.green);
    return await generateAIConfigManual();
  }
  else {
    try {
      return await generateAIConfigAuto(userDesire);
    }
    catch (err: any) {
      Logger.type('Unable to automatically generate AI config based on user desire.', Color.red, 'Falling back to manual mode.');
      return await generateAIConfigManual();
    }
  }
}

/**
 * Interactively create an AI configuration by prompting the user to provide the name, role, and goals of the AI.
 * 
 * This function guides the user through a series of prompts to collect the necessary information to create
 * an AIConfig object. The user will be asked to provide a name and role for the AI, as well as up to five
 * goals. If the user does not provide a value for any of the fields, default values will be used.
 */
async function generateAIConfigManual () {
  let aiName: string = 'Smith';
  Logger.type('Create an AI assistant:', Color.green, 'Enter the name of your AI and its role below. Entering nothing will load defaults.');

  Logger.type('Name your AI: ', Color.green, 'For example, \'Entrepreneur-GPT\'');

  const answer = await cleanInput('\tAI name : ');
  if (answer) {
    aiName = answer;
  }

  Logger.type(`${aiName} here!`, Color.cyan, 'I am at your service.');

  Logger.type('Describe your AI\'s role: ', Color.green, 'For example, \'an AI designed to autonomously develop and run businesses with the sole goal of increasing your net worth.\'');

  let aiRole = await cleanInput(`\t${aiName} role is: `);
  if (!aiRole) {
    aiRole = 'an AI designed to autonomously develop and run businesses with the sole goal of increasing your net worth.';
  }

  Logger.type('Enter up to 5 goals for your AI: ', Color.green, 'For example: \n\'Increase net worth, Grow Twitter Account, Develop and manage multiple businesses autonomously\'');
  Logger.info('Enter nothing to load defaults, enter nothing when finished.');
  const aiGoals: string[] = [];
  for (let i = 0; i < 5; ++i) {
    let aiGoal = await cleanInput(`\t${Color.cyan}Goal${Color.reset} #${i + 1}: `);
    if (!aiGoal) {
      break;
    }
    aiGoals.push(aiGoal);
  }
  if (aiGoals.length === 0) {
    aiGoals.push('Increase net worth');
    aiGoals.push('Grow Twitter Account');
    aiGoals.push('Develop and manage multiple businesses autonomously');
  }

  Logger.type('Enter your budget for API calls: ', Color.green, 'For example: $1.50');
  Logger.info('Enter nothing to let the AI run without monetary limit.');
  let apiBudget: string | number = await cleanInput(`\t${Color.cyan}Budget${Color.reset}: $`);
  if (apiBudget === '') {
    apiBudget = 0.0;
  }
  else {
    try {
      apiBudget = parseFloat(apiBudget.replace('$', ''));
    }
    catch (err: any) {
      Logger.type('Invalid budget input. Setting budget to unlimited', Color.red);
      apiBudget = 0.0;
    }
  }

  return new AIConfig(aiName, aiRole, aiGoals, apiBudget);
}

async function generateAIConfigAuto (userDesire: string) {
  const systemPrompt =
`
Your task is to devise up to 5 highly effective goals and an appropriate role-based name (_GPT) for an autonomous agent, ensuring that the goals are optimally aligned with the successful completion of its assigned task.

The user will provide the task, you will provide only the output in the exact format specified below with no explanation or conversation.

Example input:
Help me with marketing my business

Example output:
Name: CMOGPT
Description: a professional digital marketer AI that assists Solopreneurs in growing their businesses by providing world-class expertise in solving marketing problems for SaaS, content products, agencies, and more.
Goals:
- Engage in effective problem-solving, prioritization, planning, and supporting execution to address your marketing needs as your virtual Chief Marketing Officer.

- Provide specific, actionable, and concise advice to help you make informed decisions without the use of platitudes or overly wordy explanations.

- Identify and prioritize quick wins and cost-effective campaigns that maximize results with minimal time and budget investment.

- Proactively take the lead in guiding you and offering suggestions when faced with unclear information or uncertainty to ensure your marketing strategy remains on track.
`;

  const messages: Message[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Task: '${userDesire}'\nRespond only with the output in the exact format specified in the system prompt, with no explanation or conversation.\n`,
    },
  ];

  const output = await createChatCompletion(messages, Config.fastLLMModel);

  Logger.debug('AI config generator raw output:', output);

  const aiName = output.match(/Name(?:\s*):(?:\s*)(.*)/)?.at(1);
  const aiRole = output.match(/Description(?:\s*):(?:\s*)(.*?)(?:(?:\n)|Goals)/)?.at(1);
  const aiGoals = [ ...output.matchAll(/(?<=\n)-\s*(.*)/g)].map((g) => g.at(1)).filter(Boolean) as string[];
  const apiBudget = 0.0;
  if (!aiName || !aiRole || aiGoals.length === 0) {
    throw new Error('Unable to extract sufficient information...');
  }
  return new AIConfig(aiName, aiRole, aiGoals, apiBudget);
}