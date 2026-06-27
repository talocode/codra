import chalk from 'chalk';
import { getConfig } from '../config.js';

export async function providerCommand(args: string[]) {
  const config = getConfig();
  if (args.length === 0) {
    console.log(chalk.cyan(`\n  Current Provider: ${config.provider || 'Not configured'}`));
    console.log(chalk.gray('  Use /provider <name> to change the provider.'));
    console.log(chalk.gray('  Supported: mock, ollama, openai, gemini, anthropic\n'));
  } else {
    const newProvider = args[0];
    const { saveConfig } = await import('../config.js');
    saveConfig({ provider: newProvider });
    console.log(chalk.green(`\n  Provider updated to: ${newProvider}\n`));
  }
}
