import chalk from 'chalk';

export async function clearCommand() {
  console.clear();
  console.log(chalk.cyan('\n  Codra Code v0.1.0'));
  console.log(chalk.gray('  Session cleared.\n'));
}
