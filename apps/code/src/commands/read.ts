import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function readCommand(args: string[]) {
  if (args.length === 0) {
    console.log(chalk.red('\n  Usage: /read <path>\n'));
    return;
  }

  const filePath = args[0];
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(chalk.red(`\n  File not found: ${filePath}\n`));
    return;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log(chalk.cyan(`\n  File: ${filePath}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(content);
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  } catch (e) {
    console.log(chalk.red(`\n  Error reading file: ${e}\n`));
  }
}
