import chalk from 'chalk';
import { getConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { getActiveSkill } from '../skills/active.js';
export async function statusCommand() {
    const config = getConfig();
    console.log(chalk.cyan('\n  Codra Code Status:'));
    console.log(chalk.gray(`  Version: 0.1.2`));
    console.log(chalk.gray(`  Provider: ${config.provider}`));
    console.log(chalk.gray(`  Model: ${config.model}`));
    console.log(chalk.gray(`  Mode: ${config.mockMode ? 'Test Mode (Mock)' : 'Production'}`));
    console.log(chalk.gray(`  Project: ${process.cwd()}`));
    console.log(chalk.gray(`  API Key: ${config.apiKey ? '****' : 'Not configured'}`));
    const activeSkill = getActiveSkill();
    if (activeSkill) {
        console.log(chalk.gray(`  Active Skill: ${activeSkill.name}`));
    }
    else {
        console.log(chalk.gray('  Active Skill: None'));
    }
    try {
        const provider = createProvider(config.provider, {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey
        });
        const available = await provider.isAvailable();
        console.log(chalk.gray(`  Provider Status: ${available ? 'Available' : 'Unavailable'}`));
    }
    catch (e) {
        console.log(chalk.gray(`  Provider Status: Error`));
    }
    console.log('');
}
