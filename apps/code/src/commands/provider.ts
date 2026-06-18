import chalk from 'chalk';
import { getConfig, updateConfig } from '../config';

export async function providerCommand(args: string[]) {
  const config = getConfig();
  if (args.length === 0) {
    console.log(chalk.cyan(`\n  Current Provider: ${config.provider || 'Not configured'}`));
    console.log(chalk.gray('  Use /provider <name> to change the provider.'));
    console.log(chalk.gray('  Supported: openai, anthropic, ollama, custom\n'));
  } else {
    const newProvider = args[0];
    updateConfig({ provider: newProvider });
    console.log(chalk.green(`\n  Provider updated to: ${newProvider}\n`));
  }
}
