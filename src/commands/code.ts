import { callAIFunction } from "../llm.utils.js";

/**
 * A function that takes in code and suggestions and returns a response from create chat completion api call.
 */
export async function improveCode (suggestions: string[], code: string) {
  const functionString = 'function generateImproveCode(suggestions: string[], code: string[]): string;';
  const args = [ JSON.stringify(suggestions), code ];
  const desc = 'Improves the provided code based on the suggestions provided, making no other changes.';
  return callAIFunction(functionString, args, desc);
}

/**
 * A function that takes in a string and returns a response from create chat completion api call.
 */
export async function analyseCode (code: string) {
  const functionString = 'function analyseCode(code string): string;';
  const args = [ code ];
  const desc = 'Analyzes the given code and returns a list of suggestions for improvements.';
  return callAIFunction(functionString, args, desc);
}

/**
 * A function that takes in code and focus topics and returns a response from create chat completion api call.
 */
export async function writeTests (code: string, focus?: string[]) {
  const functionString = 'function createTestCases(code: string, focus?: string[]): string;'
  const args = [ code ];
  if (focus) {
    args.push(JSON.stringify(focus));
  }
  const desc = 'Generates test cases for the existing code, focusing on specific areas if required.';
  return await callAIFunction(functionString, args, desc);
}

export async function generateCode (description: string) {
  const functionString = 'function generateCode(description string): string;';
  const args = [ description ];
  const desc = 'Analyzes the given description and return code in Typescript, with proper types, that accomplishes the described goal.';
  return callAIFunction(functionString, args, desc);
}