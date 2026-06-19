import chalk from 'chalk';
import { getConfig, updateConfig } from '../config.js';

export async function modelCommand(args: string[]) {
  const config = getConfig();
  if (args.length === 0) {
    console.log(chalk.cyan(`\n  Current Model: ${config.model || 'Not configured'}`));
    console.log(chalk.gray('  Use /model <name> to change the model.\n'));
  } else {
    const newModel = args[0];
    updateConfig({ model: newModel });
    console.log(chalk.green(`\n  Model updated to: ${newModel}\n`));
  }
}
