import chalk from 'chalk';
import { getConfig } from '../config';

export async function statusCommand() {
  const config = getConfig();
  console.log(chalk.cyan('\n  Codra Code Status:'));
  console.log(chalk.gray(`  Provider: ${config.provider || 'Not configured'}`));
  console.log(chalk.gray(`  Model: ${config.model || 'Not configured'}`));
  console.log(chalk.gray(`  Project: ${process.cwd()}`));
  console.log(chalk.gray(`  API Key: ${config.apiKey ? '****' : 'Not configured'}`));
  console.log('');
}
