import readline from 'readline/promises';
import { AIConfig } from './config/ai.config';
import { Message } from './openai';
import { createChatCompletion } from './llm.utils';
import { Config } from './config';
import { Logger } from './log/logger';

/**
 * Prompt the user for input
 */
export async function promptUser () {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  Logger.log('Welcome to X-GPT! Run with \'help\' for more informations.\n');

  Logger.log('Create an AI assistant: input \'--manual\' to enter manual mode');

  let userDesire = await rl.question('I want X-GPT to ');

  if (userDesire === '') {
    userDesire = 'Write a wikipedia style article about the project: https://github.com/paubertin/xgpt.git'
  }

  if (userDesire.includes('--manual')) {
    Logger.log('Manual mode selected');
    return await generateAIConfigManual();
  }
  else {
    try {
      return await generateAIConfigAuto(userDesire);
    }
    catch (err: any) {
      Logger.error('Unable to automatically generate AI config based on user desire...');
      Logger.error('Falling back to manual mode');
      return await generateAIConfigManual();
    }
  }
}

async function generateAIConfigManual () {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let aiName: string = 'Smith';
  Logger.log('Create an AI assistant');
  Logger.log('Enter the name of your AI and its role below. Entering nothing will load defaults.\n');
  let answer = await rl.question('\tAI name :');
  if (answer) {
    aiName = answer;
  }

  Logger.log('\n');
  Logger.log(`${aiName} here! I am at your service.\n`);

  Logger.log('Describe your AI\'s role: For example, \'an AI designed to autonomously develop and run businesses with the sole goal of increasing your net worth.\'');
  Logger.log('Entering nothing will load defaults.\n')
  let aiRole = await rl.question(`\t${aiName} role is :`);
  if (!aiRole) {
    aiRole = 'an AI designed to autonomously develop and run businesses with the sole goal of increasing your net worth.';
  }

  Logger.log('Enter up to 5 goals for your AI: For example: \n\'Increase net worth, Grow Twitter Account, Develop and manage multiple businesses autonomously\'');
  Logger.log('Entering nothing will load defaults.\n')
  const aiGoals: string[] = [];
  for (let i = 0; i < 5; ++i) {
    let aiGoal = await rl.question(`\tGoal #${i + 1} :`);
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

  Logger.log('Enter your budget for API calls: for example $1.50');
  Logger.log('Enter nothing to let the AI run without monetary limit.\n');
  let apiBudget: string | number = await rl.question(`\tBudget: $`);
  if (apiBudget === '') {
    apiBudget = 0.0;
  }
  else {
    try {
      apiBudget = parseFloat(apiBudget.replace('$', ''));
    }
    catch (err: any) {
      Logger.error('Invalid budget input. Setting budget to unlimited');
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
    Logger.error('Unable to extract sufficient information automatically...');
    throw new Error('Unable to extract sufficient information...');
  }
  return new AIConfig(aiName, aiRole, aiGoals, apiBudget);
}