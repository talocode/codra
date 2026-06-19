import chalk from 'chalk';
import { getCurrentSession } from '../repl.js';

export async function sessionCommand() {
  const session = getCurrentSession();
  
  console.log(chalk.cyan('\n  Current Session:'));
  console.log(chalk.gray(`  ID: ${session.id}`));
  console.log(chalk.gray(`  Started: ${session.startTime}`));
  console.log(chalk.gray(`  File: ${session.filePath}`));
  console.log(chalk.gray(`  Entries: ${session.entries.length}`));
  console.log('');
}
