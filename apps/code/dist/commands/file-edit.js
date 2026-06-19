import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { isSecretsFile } from '../config.js';
import { addPendingEdit, getPendingEdits, discardPendingEdits } from '../session/pending.js';
export async function appendCommand(args) {
    if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /append <path> <content>\n'));
        return;
    }
    const filePath = args[0];
    const content = args.slice(1).join(' ');
    const fullPath = path.resolve(process.cwd(), filePath);
    if (isSecretsFile(fullPath)) {
        console.log(chalk.red(`\n  Access denied: ${filePath} is a sensitive file.\n`));
        return;
    }
    if (!fs.existsSync(fullPath)) {
        console.log(chalk.red(`\n  File not found: ${filePath}\n`));
        return;
    }
    addPendingEdit({
        type: 'append',
        path: filePath,
        fullPath,
        content,
        timestamp: new Date().toISOString()
    });
    console.log(chalk.green(`\n  Pending append to ${filePath}`));
    console.log(chalk.gray('  Use /apply to apply pending edits'));
    console.log(chalk.gray('  Use /discard to discard pending edits\n'));
}
export async function patchCommand(args) {
    if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /patch <path> <patch-content>\n'));
        return;
    }
    const filePath = args[0];
    const patchContent = args.slice(1).join(' ');
    const fullPath = path.resolve(process.cwd(), filePath);
    if (isSecretsFile(fullPath)) {
        console.log(chalk.red(`\n  Access denied: ${filePath} is a sensitive file.\n`));
        return;
    }
    addPendingEdit({
        type: 'patch',
        path: filePath,
        fullPath,
        content: patchContent,
        timestamp: new Date().toISOString()
    });
    console.log(chalk.green(`\n  Pending patch for ${filePath}`));
    console.log(chalk.gray('  Use /apply to apply pending edits'));
    console.log(chalk.gray('  Use /discard to discard pending edits\n'));
}
export async function diffCommand(args) {
    if (args.length === 0) {
        console.log(chalk.red('\n  Usage: /diff <path>\n'));
        return;
    }
    const filePath = args[0];
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(chalk.red(`\n  File not found: ${filePath}\n`));
        return;
    }
    const { execSync } = await import('child_process');
    try {
        const diff = execSync(`git diff -- ${filePath}`, { encoding: 'utf-8', cwd: process.cwd() });
        if (diff) {
            console.log(chalk.cyan(`\n  Git Diff for ${filePath}:`));
            console.log(diff);
        }
        else {
            console.log(chalk.green(`\n  No uncommitted changes for ${filePath}\n`));
        }
    }
    catch {
        console.log(chalk.gray('\n  Not a git repository or file not tracked\n'));
    }
}
export async function pendingCommand() {
    const pending = getPendingEdits();
    if (pending.length === 0) {
        console.log(chalk.gray('\n  No pending edits\n'));
        return;
    }
    console.log(chalk.cyan('\n  Pending Edits:'));
    pending.forEach((edit, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${edit.type}: ${edit.path}`));
    });
    console.log('');
}
export async function applyCommand() {
    const pending = getPendingEdits();
    if (pending.length === 0) {
        console.log(chalk.gray('\n  No pending edits to apply\n'));
        return;
    }
    const { execSync } = await import('child_process');
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const confirm = await new Promise((resolve) => {
        rl.question(chalk.yellow(`  Apply ${pending.length} pending edit(s)? (y/N) `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
    if (!confirm) {
        console.log(chalk.gray('\n  Apply cancelled\n'));
        return;
    }
    let applied = 0;
    let failed = 0;
    for (const edit of pending) {
        try {
            if (edit.type === 'append') {
                fs.appendFileSync(edit.fullPath, edit.content);
                applied++;
            }
            else if (edit.type === 'patch') {
                // Simple patch implementation - append content for now
                fs.appendFileSync(edit.fullPath, '\n' + edit.content);
                applied++;
            }
        }
        catch (e) {
            console.log(chalk.red(`  Failed to apply edit to ${edit.path}: ${e}`));
            failed++;
        }
    }
    discardPendingEdits();
    console.log(chalk.green(`\n  Applied ${applied} edit(s), ${failed} failed\n`));
}
export async function discardCommand() {
    const pending = getPendingEdits();
    if (pending.length === 0) {
        console.log(chalk.gray('\n  No pending edits to discard\n'));
        return;
    }
    discardPendingEdits();
    console.log(chalk.green(`\n  Discarded ${pending.length} pending edit(s)\n`));
}
