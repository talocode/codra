import * as os from 'os';
import chalk from 'chalk';
import { renderLogo } from './logo.js';
import { renderShortcuts } from './shortcuts.js';
import { getConfig } from '../config.js';
import { loadPermissionConfig } from '../permissions/config.js';
import { getActiveSkills } from '../skills/active.js';
const VERSION = '0.2.3';
export function renderHomeScreen() {
    const config = getConfig();
    const permConfig = loadPermissionConfig();
    const skills = getActiveSkills();
    const cwd = process.cwd();
    const homeDir = os.homedir();
    const relPath = cwd.startsWith(homeDir) ? '~' + cwd.slice(homeDir.length) : cwd;
    const lines = [];
    // Logo
    lines.push(...renderLogo());
    // Subtitle
    lines.push('  ' + chalk.gray('Local-first coding agent by Talocode'));
    lines.push('');
    // Status line
    const modeLabel = config.mockMode ? 'Test Mode' : 'Build';
    const providerModel = `${config.provider}/${config.model}`;
    const permLabel = permConfig.level;
    lines.push('  ' + chalk.gray('▸ ') +
        chalk.white(modeLabel) +
        chalk.gray(' · ') +
        chalk.white('Codra Auto') +
        chalk.gray(' · ') +
        chalk.hex('#ef6c2e')(providerModel) +
        chalk.gray(' · ') +
        chalk.gray(permLabel));
    // Active skills indicator
    if (skills.length > 0) {
        const skillNames = skills.length <= 2
            ? skills.map(s => s.name).join(', ')
            : `${skills[0].name} +${skills.length - 1} more`;
        lines.push('  ' + chalk.gray('▸ ') + chalk.hex('#06d6a0')(`${skills.length} skill${skills.length > 1 ? 's' : ''}: `) + chalk.gray(skillNames));
    }
    lines.push('');
    // Composer
    lines.push('  ' + chalk.gray('╭──────────────────────────────────────────────────────────╮'));
    lines.push('  ' + chalk.gray('│') + '  ' + chalk.gray('Type your task... ') + chalk.dim('(/ for commands)') + '                                  ' + chalk.gray('│'));
    lines.push('  ' + chalk.gray('╰──────────────────────────────────────────────────────────╯'));
    lines.push('');
    // Shortcuts
    lines.push(...renderShortcuts());
    lines.push('');
    // Tips
    const tips = [
        'Run /connect to choose your LLM provider',
        'Use /skills to discover and activate task skills',
        'Run /plan to create structured execution plans',
        'Use /thread to organize work into sessions',
    ];
    const tip = tips[Math.floor(Date.now() / 86400000) % tips.length];
    lines.push('  ' + chalk.dim('Tip: ') + chalk.gray(tip));
    lines.push('');
    // Footer
    lines.push('  ' + chalk.dim(relPath) +
        '                                                                 ' +
        chalk.dim(`v${VERSION}`));
    lines.push('');
    // Output
    process.stdout.write('\x1B[2J\x1B[H');
    console.log(lines.join('\n'));
}
export function canShowTui() {
    if (!process.stdout.isTTY)
        return false;
    if (process.env.CI)
        return false;
    const cols = process.stdout.columns || 80;
    if (cols < 60)
        return false;
    return true;
}
