import { exec } from 'child_process';
import chalk from 'chalk';
import * as readline from 'readline';
import { setLastCommandResult } from '../session/commands.js';

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'sudo rm -rf',
  'chmod -R 777 /',
  'sudo chmod',
  ':(){:|:&};:',
  'dd if=/dev/zero',
  'mkfs',
  '> /dev/sda'
];

function isCommandBlocked(command: string): boolean {
  const lower = command.toLowerCase();
  return BLOCKED_COMMANDS.some(blocked => lower.includes(blocked));
}

function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(chalk.yellow(`  ${question} (y/N) `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

export async function runCommand(args: string[]) {
  if (args.length === 0) {
    console.log(chalk.red('\n  Usage: /run <command>\n'));
    return;
  }

  const command = args.join(' ');

  if (isCommandBlocked(command)) {
    console.log(chalk.red(`\n  Blocked: "${command}" is a potentially dangerous command\n`));
    return;
  }

  const confirm = await askConfirmation(`Run command: ${command}?`);

  if (!confirm) {
    console.log(chalk.gray('\n  Command cancelled.\n'));
    return;
  }

  console.log(chalk.gray(`\n  Running: ${command}\n`));
  
  exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (error) console.error(chalk.red(`Error: ${error.message}`));
    
    const output = [stdout, stderr, error?.message].filter(Boolean).join('\n');
    setLastCommandResult({
      command,
      output: output.substring(0, 1000),
      timestamp: new Date().toISOString()
    });
    
    console.log('');
  });
}
