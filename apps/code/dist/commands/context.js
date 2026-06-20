import chalk from 'chalk';
import { loadProjectInstructions } from '../context/projectInstructions.js';
export async function contextCommand(args) {
    if (args.length === 0) {
        const files = loadProjectInstructions();
        if (files.length === 0) {
            console.log(chalk.gray('\n  No project instruction files found.'));
            console.log(chalk.gray('  Create CODRA.md, .codra/instructions.md, or AGENTS.md for project context.\n'));
        }
        else {
            console.log(chalk.cyan('\n  Project Context Files:'));
            files.forEach(f => console.log(chalk.gray(`    - ${f}`)));
            console.log('');
        }
        return;
    }
    const subcommand = args[0];
    switch (subcommand) {
        case 'files':
            const files = loadProjectInstructions();
            if (files.length === 0) {
                console.log(chalk.gray('\n  No project instruction files found.\n'));
            }
            else {
                console.log(chalk.cyan('\n  Project Instruction Files:'));
                files.forEach(f => console.log(chalk.gray(`    - ${f}`)));
                console.log('');
            }
            break;
        case 'reload':
            const reloadedFiles = loadProjectInstructions();
            console.log(chalk.green(`\n  Reloaded ${reloadedFiles.length} instruction file(s).\n`));
            break;
        default:
            console.log(chalk.gray('\n  Usage: /context | /context files | /context reload\n'));
            break;
    }
}
