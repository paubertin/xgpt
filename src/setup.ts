import readline from 'readline/promises';
import { AIConfig } from './config/ai.config';

/**
 * Prompt the user for input
 */
export async function promptUser () {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let aiName: string = 'Smith';

  console.log('Welcome to X-GPT! Run with \'help\' for more informations.\n');

  console.log('Create an AI assistant...');

  console.log('Enter the name of your AI and its role below. Entering nothing will load defaults.\n');
  let answer = await rl.question('\tAI name :');
  if (answer) {
    aiName = answer;
  }

  console.log('\n');
  console.log(`${aiName} here! I am at your service.\n`);

  console.log('Describe your AI\'s role: For example, \'an AI designed to autonomously develop and run businesses with the sole goal of increasing your net worth.\'');
  console.log('Entering nothing will load defaults.\n')
  let aiRole = await rl.question(`\t${aiName} role is :`);
  if (!aiRole) {
    aiRole = 'an AI designed to autonomously develop and run businesses with the sole goal of increasing your net worth.';
  }

  console.log('Enter up to 5 goals for your AI: For example: \n\'Increase net worth, Grow Twitter Account, Develop and manage multiple businesses autonomously\'');
  console.log('Entering nothing will load defaults.\n')
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

  return new AIConfig(aiName, aiRole, aiGoals);
}