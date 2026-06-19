import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { addFileContext, getFileContext } from '../repl.js';
import { isSecretsFile } from '../config.js';
export async function readCommand(args) {
    if (args.length === 0) {
        console.log(chalk.cyan('\n  File Context:'));
        const context = getFileContext();
        if (context.length === 0) {
            console.log(chalk.gray('  No files in context.'));
        }
        else {
            console.log(chalk.gray(`  ${context.length} file(s) in context.`));
        }
        console.log('');
        return;
    }
    const filePath = args[0];
    const addToContext = args.includes('--context') || args.includes('-c');
    const fullPath = path.resolve(process.cwd(), filePath);
    if (isSecretsFile(fullPath)) {
        console.log(chalk.red(`\n  Access denied: ${filePath} is a sensitive file.\n`));
        return;
    }
    if (!fs.existsSync(fullPath)) {
        console.log(chalk.red(`\n  File not found: ${filePath}\n`));
        return;
    }
    try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (addToContext) {
            addFileContext(`File: ${filePath}\n${content}`);
            console.log(chalk.green(`\n  Added ${filePath} to context.`));
            console.log(chalk.gray('  The file content will be included in your next prompt.\n'));
        }
        else {
            console.log(chalk.cyan(`\n  File: ${filePath}`));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(content);
            console.log(chalk.gray('─'.repeat(50)));
            console.log(chalk.gray('  Use /read <path> --context to add to context'));
            console.log('');
        }
    }
    catch (e) {
        console.log(chalk.red(`\n  Error reading file: ${e}\n`));
    }
}
