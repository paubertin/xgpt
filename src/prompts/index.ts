import { Command, PromptGenerator } from "./generator";

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
    {
      label: 'Do Nothing',
      name: 'do_nothing',
    },
    {
      label: 'Task Complete (Shutdown)',
      name: 'task_complete',
      args: [ '<reason>' ],
    }
  ];

  commands.forEach((command) => {
    promptGenerator.addCommand(command.label, command.name, command.args);
  });
}