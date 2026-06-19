import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as readline from 'readline';

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

export async function writeCommand(args: string[]) {
  if (args.length < 2) {
    console.log(chalk.red('\n  Usage: /write <path> <content>\n'));
    return;
  }

  const filePath = args[0];
  const content = args.slice(1).join(' ');
  const fullPath = path.resolve(process.cwd(), filePath);

  const confirm = await askConfirmation(`Write to ${filePath}?`);

  if (confirm) {
    try {
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content);
      console.log(chalk.green(`\n  File written: ${filePath}\n`));
    } catch (e) {
      console.log(chalk.red(`\n  Error writing file: ${e}\n`));
    }
  } else {
    console.log(chalk.gray('\n  Write cancelled.\n'));
  }
}
