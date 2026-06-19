import chalk from 'chalk';
import { getCurrentSession } from '../repl.js';

export async function saveCommand() {
  const session = getCurrentSession();
  
  console.log(chalk.green(`\n  Session saved: ${session.id}`));
  console.log(chalk.gray(`  File: ${session.filePath}`));
  console.log('');
}
