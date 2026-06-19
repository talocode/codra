import chalk from 'chalk';
import { listSessions } from '../session/index.js';

export async function sessionsCommand() {
  console.log(chalk.cyan('\n  Sessions:'));
  
  const sessions = listSessions();
  
  if (sessions.length === 0) {
    console.log(chalk.gray('  No sessions found.'));
  } else {
    sessions.forEach((session, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${session}`));
    });
  }
  
  console.log('');
}
