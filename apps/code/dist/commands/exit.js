import chalk from 'chalk';
export async function exitCommand() {
    console.log(chalk.cyan('\n  Exiting Codra Code. Goodbye!\n'));
    process.exit(0);
}
