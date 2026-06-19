#!/usr/bin/env node
import { Command } from 'commander';
import { startRepl } from './repl.js';
import { loadConfig, getConfig } from './config.js';
import { createProvider } from './providers/index.js';
import { isAuthenticated, startLogin, clearAuthToken, authStatus, getAuthFilePath } from './auth/index.js';
import chalk from 'chalk';
const program = new Command();
program
    .name('codra-code')
    .description('Codra Code: A local-first, open-source coding agent for real software work')
    .version('0.1.6');
program
    .option('--mock', 'Run in test mode (mock provider, no API calls)')
    .option('--provider <provider>', 'Override provider (mock, openai, ollama)')
    .option('--model <model>', 'Override model name')
    .option('--yes', 'Skip confirmation prompts for non-interactive mode');
// Auth commands (no auth required)
program
    .command('login')
    .description('Authenticate with Tera account')
    .option('--no-browser', 'Do not open browser, print URL instead')
    .option('--auth-url <url>', 'Custom Tera auth URL for local development')
    .action(async (options) => {
    await startLogin({
        noBrowser: options.noBrowser,
        authUrl: options.authUrl
    });
});
program
    .command('logout')
    .description('Sign out and remove stored credentials')
    .action(async () => {
    await clearAuthToken();
    console.log(chalk.green('\n  ✓ Signed out successfully.\n'));
});
program
    .command('auth')
    .description('Show authentication status')
    .action(async () => {
    await authStatus();
});
program
    .command('auth-status')
    .description('Show authentication status (alias)')
    .action(async () => {
    await authStatus();
});
program
    .command('auth:token-path')
    .description('Show auth token file path')
    .action(() => {
    console.log(chalk.gray(`\n  Auth token path: ${getAuthFilePath()}\n`));
});
// Start command
program
    .command('start')
    .description('Start the Codra Code interface')
    .action(async (options) => {
    await loadConfig();
    applyOptions(options);
    // Check auth
    if (!isAuthenticated()) {
        console.log(chalk.red('\n  Codra Code requires a Tera account.'));
        console.log(chalk.gray('  Run: codra-code login'));
        console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin\n'));
        return;
    }
    startRepl();
});
// Default action
program.action(async (options) => {
    await loadConfig();
    applyOptions(options);
    const args = program.args;
    if (args.length > 0) {
        const command = args.join(' ');
        await executeNonInteractive(command);
    }
    else if (!process.stdin.isTTY) {
        let input = '';
        process.stdin.setEncoding('utf-8');
        for await (const chunk of process.stdin) {
            input += chunk;
        }
        await executeNonInteractive(input.trim());
    }
    else {
        // Check auth for interactive mode
        if (!isAuthenticated()) {
            console.log(chalk.red('\n  Codra Code requires a Tera account.'));
            console.log(chalk.gray('  Run: codra-code login'));
            console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin\n'));
            return;
        }
        startRepl();
    }
});
function applyOptions(options) {
    const config = getConfig();
    if (options.mock) {
        config.mockMode = true;
        config.provider = 'mock';
    }
    if (options.provider) {
        config.provider = options.provider;
        if (options.provider !== 'mock' && !config.apiKey) {
            config.mockMode = true;
        }
    }
    if (options.model) {
        config.model = options.model;
    }
}
async function executeNonInteractive(input) {
    const config = getConfig();
    // Check auth for protected commands
    if (!input.startsWith('/login') && !input.startsWith('/logout') &&
        !input.startsWith('/auth') && !input.startsWith('/help')) {
        if (!isAuthenticated()) {
            console.log(chalk.red('\n  Codra Code requires a Tera account.'));
            console.log(chalk.gray('  Run: codra-code login'));
            console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin\n'));
            process.exit(1);
        }
    }
    let provider;
    try {
        provider = createProvider(config.provider, {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey
        });
    }
    catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.log(`Error: ${errorMessage}`);
        process.exit(1);
    }
    if (input.startsWith('/')) {
        const { handleCommand } = await import('./commands/index.js');
        await handleCommand(input);
    }
    else {
        try {
            const response = await provider.chat([{ role: 'user', content: input }], config.model);
            console.log(response.content);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error: ${errorMessage}`);
            process.exit(1);
        }
    }
    process.exit(0);
}
program.parse(process.argv);
