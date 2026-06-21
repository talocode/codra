import chalk from 'chalk';
import { getCurrentSession } from '../session/state.js';
export async function saveCommand() {
    const session = getCurrentSession();
    if (!session) {
        console.log(chalk.gray('\n  No active session.\n'));
        return;
    }
    console.log(chalk.green(`\n  Session saved: ${session.id}`));
    console.log(chalk.gray(`  File: ${session.filePath}`));
    console.log('');
}
