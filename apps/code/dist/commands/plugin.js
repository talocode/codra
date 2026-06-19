import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
function loadPlugin(pluginDir) {
    const pluginJsonPath = path.join(pluginDir, 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(pluginJsonPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function findPlugins() {
    const plugins = [];
    const pluginDirs = [
        path.join(process.cwd(), 'plugins'),
        path.join(process.cwd(), '.codra/plugins'),
        path.join(os.homedir(), '.codra/plugins')
    ];
    for (const dir of pluginDirs) {
        if (!fs.existsSync(dir))
            continue;
        const items = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
        for (const item of items) {
            const pluginDir = path.join(dir, item);
            const plugin = loadPlugin(pluginDir);
            if (plugin) {
                plugins.push({ plugin, dir: pluginDir });
            }
        }
    }
    return plugins;
}
export async function pluginCommand(args) {
    if (args.length === 0) {
        await listPlugins();
        return;
    }
    const subcommand = args[0];
    switch (subcommand) {
        case 'run':
            await runPlugin(args[1]);
            break;
        default:
            await showPluginInfo(args[0]);
    }
}
async function listPlugins() {
    console.log(chalk.cyan('\n  Installed Plugins:'));
    const plugins = findPlugins();
    if (plugins.length === 0) {
        console.log(chalk.gray('  No plugins found.'));
    }
    else {
        plugins.forEach(({ plugin }) => {
            console.log(chalk.gray(`  - ${plugin.name}: ${plugin.description}`));
        });
    }
    console.log('');
}
async function showPluginInfo(name) {
    const plugins = findPlugins();
    const found = plugins.find(p => p.plugin.name === name);
    if (!found) {
        console.log(chalk.red(`\n  Plugin not found: ${name}\n`));
        return;
    }
    const { plugin } = found;
    console.log(chalk.cyan(`\n  Plugin: ${plugin.name}`));
    console.log(chalk.gray(`  Description: ${plugin.description}`));
    console.log(chalk.gray(`  Version: ${plugin.version}`));
    console.log(chalk.gray(`  Commands: ${plugin.commands.join(', ')}`));
    console.log(chalk.gray(`  Permissions: ${plugin.permissions.join(', ')}`));
    console.log('');
}
async function runPlugin(name) {
    if (!name) {
        console.log(chalk.red('\n  Usage: /plugin run <name>\n'));
        return;
    }
    const plugins = findPlugins();
    const found = plugins.find(p => p.plugin.name === name);
    if (!found) {
        console.log(chalk.red(`\n  Plugin not found: ${name}\n`));
        return;
    }
    const { plugin } = found;
    console.log(chalk.cyan(`\n  Running plugin: ${plugin.name}`));
    try {
        switch (name) {
            case 'git-status':
                await runGitStatusPlugin();
                break;
            case 'project-summary':
                await runProjectSummaryPlugin();
                break;
            case 'test-runner':
                await runTestRunnerPlugin();
                break;
            default:
                console.log(chalk.gray('  Plugin execution not implemented'));
        }
    }
    catch (e) {
        console.log(chalk.red(`\n  Plugin error: ${e}\n`));
    }
    console.log('');
}
async function runGitStatusPlugin() {
    try {
        const status = execSync('git status --short', { encoding: 'utf-8', cwd: process.cwd() });
        const branch = execSync('git branch --show-current', { encoding: 'utf-8', cwd: process.cwd() });
        console.log(chalk.gray(`  Branch: ${branch}`));
        if (status) {
            const lines = status.trim().split('\n');
            console.log(chalk.gray(`  Changes: ${lines.length} file(s)`));
            console.log(status);
        }
        else {
            console.log(chalk.green('  Working tree clean'));
        }
    }
    catch {
        console.log(chalk.gray('  Not a git repository'));
    }
}
async function runProjectSummaryPlugin() {
    const files = fs.readdirSync(process.cwd()).filter(f => !f.startsWith('.'));
    console.log(chalk.gray(`  Files: ${files.length}`));
    files.slice(0, 20).forEach(f => console.log(chalk.gray(`    ${f}`)));
    if (files.length > 20) {
        console.log(chalk.gray(`    ... and ${files.length - 20} more`));
    }
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        console.log(chalk.gray(`  Package: ${pkg.name || 'Unknown'}`));
        console.log(chalk.gray(`  Version: ${pkg.version || 'Unknown'}`));
    }
}
async function runTestRunnerPlugin() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.log(chalk.gray('  No package.json found'));
        return;
    }
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (pkg.scripts?.test) {
        console.log(chalk.gray(`  Test command: ${pkg.scripts.test}`));
        console.log(chalk.gray('  Run with: npm test'));
    }
    else {
        console.log(chalk.gray('  No test script configured'));
    }
}
