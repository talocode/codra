import chalk from 'chalk';
import { getCurrentSession } from '../session/state.js';
export async function sessionCommand() {
    const session = getCurrentSession();
    if (!session) {
        console.log(chalk.gray('\n  No active session.\n'));
        return;
    }
    console.log(chalk.cyan('\n  Current Session:'));
    console.log(chalk.gray(`  ID: ${session.id}`));
    console.log(chalk.gray(`  Started: ${session.startTime}`));
    console.log(chalk.gray(`  File: ${session.filePath}`));
    console.log(chalk.gray(`  Entries: ${session.entries.length}`));
    console.log('');
}
