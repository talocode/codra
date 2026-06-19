import chalk from 'chalk';
import { getConfig } from '../config.js';
import { createProvider } from '../providers/index.js';

export async function statusCommand() {
  const config = getConfig();
  
  console.log(chalk.cyan('\n  Codra Code Status:'));
  console.log(chalk.gray(`  Provider: ${config.provider}`));
  console.log(chalk.gray(`  Model: ${config.model}`));
  console.log(chalk.gray(`  Mock Mode: ${config.mockMode ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`  Project: ${process.cwd()}`));
  console.log(chalk.gray(`  API Key: ${config.apiKey ? '****' : 'Not configured'}`));
  
  try {
    const provider = createProvider(config.provider, {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey
    });
    const available = await provider.isAvailable();
    console.log(chalk.gray(`  Provider Status: ${available ? 'Available' : 'Unavailable'}`));
  } catch (e) {
    console.log(chalk.gray(`  Provider Status: Error`));
  }
  
  console.log('');
}
