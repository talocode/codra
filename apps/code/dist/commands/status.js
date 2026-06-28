import chalk from 'chalk';
import { getConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { getActiveSkills } from '../skills/active.js';
import { isAuthenticated, getAuthToken } from '../auth/index.js';
import { getModeLabel } from '../providers/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
export async function statusCommand() {
    const config = getConfig();
    const cwd = process.cwd();
    const configPath = path.join(cwd, '.codra/config.json');
    const userConfigPath = path.join(os.homedir(), '.codra/config.json');
    console.log(chalk.cyan('\n  Codra Code Status'));
    // Workspace
    console.log(chalk.gray(`  Workspace: ${cwd}`));
    // Git branch
    let gitBranch = 'not a git repo';
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        gitBranch = branch;
    }
    catch { }
    console.log(chalk.gray(`  Git Branch: ${gitBranch}`));
    // Auth
    const auth = getAuthToken();
    const authStatus = isAuthenticated()
        ? (auth ? `signed in as ${auth.email}` : 'signed in (dev bypass)')
        : 'not signed in';
    console.log(chalk.gray(`  Auth: ${authStatus}`));
    // Mode
    const mode = getModeLabel(config.provider);
    console.log(chalk.gray(`  Mode: ${mode}`));
    // Provider / Model
    console.log(chalk.gray(`  Provider: ${config.provider}`));
    console.log(chalk.gray(`  Model: ${config.model || 'default'}`));
    // Config paths
    console.log(chalk.gray(`  Project Config: ${fs.existsSync(configPath) ? configPath : 'not found'}`));
    console.log(chalk.gray(`  User Config: ${userConfigPath}`));
    // Slash commands count (approximate from handleCommand)
    const slashCount = 35; // approx from commands/index switch
    console.log(chalk.gray(`  Slash Commands: ~${slashCount} available (type / for menu)`));
    // Old status
    console.log(chalk.gray(`  Mock Mode: ${config.mockMode ? 'yes' : 'no'}`));
    const activeSkills = getActiveSkills();
    if (activeSkills.length > 0) {
        console.log(chalk.gray(`  Active Skills: ${activeSkills.map(s => s.name).join(', ')}`));
    }
    else {
        console.log(chalk.gray('  Active Skills: None'));
    }
    try {
        const provider = createProvider(config.provider, {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey
        });
        const available = await provider.isAvailable();
        console.log(chalk.gray(`  Provider Available: ${available ? 'yes' : 'no'}`));
    }
    catch (e) {
        console.log(chalk.gray(`  Provider Available: error`));
    }
    console.log('');
}
