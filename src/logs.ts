import { ResponseJSONFormat } from "./prompts/generator";

export function printAssistantThoughts (name: string, json: ResponseJSONFormat) {
  console.log(`${name.toUpperCase()} THOUGHTS: ${json.thoughts.text}`);
  console.log(`REASONING: ${json.thoughts.reasoning}`);
  if (json.thoughts.plan) {
    console.log('PLAN:');
    const lines = json.thoughts.plan.split('\n').map((l) => l.trim());
    for (const line of lines) {
      const i = line.indexOf('- ');
      let l = line;
      if (i >= 0) {
        l = l.substring(i + 2);
      }
      console.log(`- ${l.trim()}`);
    }
  }
  console.log(`CRITICISM: ${json.thoughts.criticism}`);
}