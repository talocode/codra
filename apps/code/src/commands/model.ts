import chalk from 'chalk';
import * as readline from 'readline';
import { getConfig } from '../config.js';
import { PROVIDER_REGISTRY, getAvailableProviders, getProviderInfo } from '../providers/registry.js';

export async function modelCommand(args: string[]) {
  const config = getConfig();
  if (args.length === 0) {
    await showModelPicker();
  } else {
    const newModel = args[0];
    const { saveConfig } = await import('../config.js');
    saveConfig({ model: newModel });
    console.log(chalk.green(`\n  Model updated to: ${newModel}\n`));
  }
}

async function showModelPicker(): Promise<void> {
  console.log(chalk.cyan('\n  Model Picker — Select Provider'));
  const current = getConfig();
  const currentInfo = getProviderInfo(current.provider) || { label: current.provider };
  console.log(chalk.gray(`  Current: ${current.model || 'n/a'} on ${currentInfo.label || current.provider}\n`));

  const providers = getAvailableProviders();
  providers.forEach((p, i) => {
    const marker = p.name === current.provider ? '>' : ' ';
    const authNote = p.needsAuth ? ' (auth required for hosted)' : p.local ? ' (local)' : '';
    console.log(chalk.gray(`  ${marker} ${i + 1}. ${p.label}${authNote}`));
  });
  console.log(chalk.gray('  0. Cancel\n'));

  const choice = await ask('  Select provider number: ');
  const idx = parseInt(choice.trim(), 10) - 1;
  if (isNaN(idx) || idx < -1 || idx >= providers.length) {
    if (choice.trim() !== '0') console.log(chalk.yellow('  Invalid selection.'));
    return;
  }
  if (idx === -1) return;

  const selectedProvider = providers[idx];
  console.log(chalk.cyan(`\n  Select model for ${selectedProvider.label}:`));

  selectedProvider.models.forEach((m, i) => {
    const marker = m === current.model ? '>' : ' ';
    console.log(chalk.gray(`  ${marker} ${i + 1}. ${m}`));
  });
  console.log(chalk.gray('  0. Cancel\n'));

  const modelChoice = await ask('  Select model number: ');
  const mIdx = parseInt(modelChoice.trim(), 10) - 1;
  if (isNaN(mIdx) || mIdx < -1 || mIdx >= selectedProvider.models.length) {
    if (modelChoice.trim() !== '0') console.log(chalk.yellow('  Invalid.'));
    return;
  }
  if (mIdx === -1) return;

  const newModel = selectedProvider.models[mIdx];
  const { saveConfig } = await import('../config.js');
  saveConfig({ provider: selectedProvider.name, model: newModel });

  console.log(chalk.green(`\n  ✓ Switched to ${newModel} on ${selectedProvider.label}\n`));
  console.log(chalk.gray('  Restart or continue session to use new provider/model.\n'));
}

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
