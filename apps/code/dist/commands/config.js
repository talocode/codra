import chalk from 'chalk';
import { getConfig } from '../config.js';
export async function configCommand() {
    const config = getConfig();
    console.log(chalk.cyan('\n  Configuration:'));
    console.log(chalk.gray(`  Provider: ${config.provider}`));
    console.log(chalk.gray(`  Model: ${config.model}`));
    console.log(chalk.gray(`  Mock Mode: ${config.mockMode ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Base URL: ${config.baseUrl || 'Default'}`));
    console.log(chalk.gray(`  API Key: ${config.apiKey ? '****' : 'Not set'}`));
    console.log('');
}
