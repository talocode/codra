import { exec } from 'child_process';
import chalk from 'chalk';
import * as readline from 'readline';
function askConfirmation(question) {
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
export async function runCommand(args) {
    if (args.length === 0) {
        console.log(chalk.red('\n  Usage: /run <command>\n'));
        return;
    }
    const command = args.join(' ');
    const confirm = await askConfirmation(`Run command: ${command}?`);
    if (confirm) {
        console.log(chalk.gray(`\n  Running: ${command}\n`));
        exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
            if (stdout)
                console.log(stdout);
            if (stderr)
                console.error(stderr);
            if (error)
                console.error(chalk.red(`Error: ${error.message}`));
            console.log('');
        });
    }
    else {
        console.log(chalk.gray('\n  Command cancelled.\n'));
    }
}
