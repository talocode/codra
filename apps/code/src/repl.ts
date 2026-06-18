import * as readline from 'readline';
import chalk from 'chalk';
import { handleCommand } from './commands/index';

export async function startRepl() {
  console.log(chalk.cyan('\n  Codra Code v0.1.0'));
  console.log(chalk.gray('  A local-first, open-source coding agent interface'));
  console.log(chalk.gray('  Type "/help" for available commands.\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('› ')
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();
    if (input) {
      if (input.startsWith('/')) {
        await handleCommand(input);
      } else {
        console.log(chalk.yellow('  (Agent response placeholder)'));
      }
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(chalk.cyan('\n  Exiting Codra Code. Goodbye!\n'));
    process.exit(0);
  });
}
