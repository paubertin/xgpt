import { callAIFunction } from "../llm.utils";
import { Command } from "./command";

const command: ((opts: {
  name: string,
  description: string;
  signature: string,
  enabled: boolean,
  disabledReason?: string}
) => MethodDecorator) = (opts: {
  name: string,
  description: string;
  signature: string,
  enabled: boolean,
  disabledReason?: string}
) => {
  return (target, propertyKey, descriptor) => {
    console.log('target', target);
    console.log('propertyKey', propertyKey);
    console.log('descriptor', descriptor);
  };
};

function analyseCode (code: string) {
  const functionString = 'function analyseCode(code string): string;';
  const args = [ code ];
  const desc = 'Analyzes the given code and returns a list of suggestions for improvements.';
  return callAIFunction(functionString, args, desc);
}

// const analyseCodeCommand = new Command('analyseCode', 'Analyse code', analyseCode);