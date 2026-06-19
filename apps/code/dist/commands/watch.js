import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { saveSessionEntry } from '../session/index.js';
import { getCurrentSession } from '../repl.js';
let watcher = null;
let watchedFiles = [];
export async function watchCommand(args) {
    const subcommand = args[0] || 'status';
    switch (subcommand) {
        case 'on':
            await startWatching();
            break;
        case 'off':
            await stopWatching();
            break;
        case 'status':
            await watchStatus();
            break;
        default:
            console.log(chalk.gray('\n  Usage: /watch [on|off|status]\n'));
    }
}
async function startWatching() {
    if (watcher) {
        console.log(chalk.yellow('\n  Already watching\n'));
        return;
    }
    const ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.codra'];
    try {
        watcher = fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
            if (!filename)
                return;
            // Check if file should be ignored
            const shouldIgnore = ignorePatterns.some(pattern => filename.startsWith(pattern));
            if (shouldIgnore)
                return;
            const fullPath = path.join(process.cwd(), filename);
            // Log change to session
            const session = getCurrentSession();
            if (session) {
                saveSessionEntry(session, {
                    timestamp: new Date().toISOString(),
                    role: 'system',
                    content: `File changed: ${filename} (${eventType})`,
                    metadata: { type: 'file-change', file: filename, event: eventType }
                });
            }
            console.log(chalk.gray(`  [watch] ${eventType}: ${filename}`));
        });
        console.log(chalk.green('\n  File watching started\n'));
    }
    catch (e) {
        console.log(chalk.red(`\n  Failed to start watching: ${e}\n`));
    }
}
async function stopWatching() {
    if (watcher) {
        watcher.close();
        watcher = null;
        console.log(chalk.green('\n  File watching stopped\n'));
    }
    else {
        console.log(chalk.gray('\n  Not watching\n'));
    }
}
async function watchStatus() {
    if (watcher) {
        console.log(chalk.green('\n  File watching: Active\n'));
    }
    else {
        console.log(chalk.gray('\n  File watching: Inactive'));
        console.log(chalk.gray('  Use /watch on to start watching\n'));
    }
}
