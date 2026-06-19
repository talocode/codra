import chalk from 'chalk';
import { execSync } from 'child_process';
import * as readline from 'readline';

function execGit(args: string): string {
  try {
    return execSync(`git ${args}`, { encoding: 'utf-8', cwd: process.cwd() }).trim();
  } catch (e) {
    return '';
  }
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

export async function gitCommand(args: string[]) {
  const subcommand = args[0] || 'summary';

  switch (subcommand) {
    case 'status':
      await gitStatus();
      break;
    case 'diff':
      await gitDiff();
      break;
    case 'branch':
      await gitBranch();
      break;
    case 'log':
      await gitLog();
      break;
    case 'commit':
      await gitCommit(args.slice(1).join(' '));
      break;
    default:
      await gitSummary();
  }
}

async function gitSummary() {
  console.log(chalk.cyan('\n  Git Summary:'));
  
  const branch = execGit('branch --show-current');
  const status = execGit('status --short');
  const lastCommit = execGit('log -1 --oneline');
  
  console.log(chalk.gray(`  Branch: ${branch || 'Not a git repo'}`));
  console.log(chalk.gray(`  Last commit: ${lastCommit || 'None'}`));
  
  if (status) {
    const changes = status.split('\n').length;
    console.log(chalk.gray(`  Changes: ${changes} file(s)`));
  } else {
    console.log(chalk.gray('  Status: Clean'));
  }
  
  console.log('');
}

async function gitStatus() {
  const status = execGit('status --short');
  
  if (!status) {
    console.log(chalk.green('\n  Working tree clean\n'));
    return;
  }
  
  console.log(chalk.cyan('\n  Git Status:'));
  console.log(status);
  console.log('');
}

async function gitDiff() {
  const diff = execGit('diff');
  
  if (!diff) {
    console.log(chalk.green('\n  No changes\n'));
    return;
  }
  
  console.log(chalk.cyan('\n  Git Diff:'));
  console.log(diff);
  console.log('');
}

async function gitBranch() {
  const branches = execGit('branch');
  
  if (!branches) {
    console.log(chalk.gray('\n  No branches found\n'));
    return;
  }
  
  console.log(chalk.cyan('\n  Git Branches:'));
  console.log(branches);
  console.log('');
}

async function gitLog() {
  const log = execGit('log --oneline -10');
  
  if (!log) {
    console.log(chalk.gray('\n  No commits found\n'));
    return;
  }
  
  console.log(chalk.cyan('\n  Recent Commits:'));
  console.log(log);
  console.log('');
}

async function gitCommit(message: string) {
  if (!message) {
    console.log(chalk.red('\n  Usage: /git commit <message>\n'));
    return;
  }
  
  const confirm = await askConfirmation(`Commit with message: "${message}"?`);
  
  if (!confirm) {
    console.log(chalk.gray('\n  Commit cancelled.\n'));
    return;
  }
  
  try {
    execSync('git add -A', { cwd: process.cwd() });
    execSync(`git commit -m "${message}"`, { cwd: process.cwd() });
    console.log(chalk.green('\n  Committed successfully\n'));
  } catch (e) {
    console.log(chalk.red(`\n  Commit failed: ${e}\n`));
  }
}
