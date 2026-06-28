#!/usr/bin/env node
import { Command } from 'commander';
import { startRepl } from './repl.js';
import { loadConfig, getConfig } from './config.js';
import { createProvider } from './providers/index.js';
import { isAuthenticated, startLogin, clearAuthToken, authStatus, getAuthFilePath } from './auth/index.js';
import { isLocalProvider } from './providers/index.js';
import chalk from 'chalk';
const program = new Command();
program
    .name('codra-code')
    .description('Codra Code: A local-first, open-source coding agent for real software work')
    .version('0.4.0');
program
    .option('--mock', 'Run in test mode (mock provider, no API calls)')
    .option('--provider <provider>', 'Override provider (mock, openai, ollama, gemini...)')
    .option('--model <model>', 'Override model name')
    .option('--yes', 'Skip confirmation prompts for non-interactive mode')
    .option('--tui', 'Show interactive TUI home screen')
    .option('--no-tui', 'Use classic REPL interface');
// Auth commands (no auth required)
program
    .command('login')
    .description('Authenticate with Tera/Talocode account')
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
// Start command - relaxed for local
program
    .command('start')
    .description('Start the Codra Code interface')
    .action(async (options) => {
    await loadConfig();
    applyOptions(options);
    const config = getConfig();
    const usingHosted = !isLocalProvider(config.provider);
    if (usingHosted && !isAuthenticated()) {
        console.log(chalk.red('\n  Sign in with your Tera/Talocode account to use hosted Codra Code.'));
        console.log(chalk.gray('  Run: codra login'));
        console.log(chalk.gray('  Local providers (ollama, mock) are available without auth.\n'));
        // allow continue with warning, or return; we'll let repl handle per use
    }
    const { canShowTui } = await import('./ui/home.js');
    const useTui = options.tui !== false && canShowTui();
    startRepl(false, useTui);
});
// Default action
program.action(async (options) => {
    await loadConfig();
    applyOptions(options);
    const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
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
        const config = getConfig();
        const usingHosted = !isLocalProvider(config.provider);
        if (usingHosted && !isAuthenticated()) {
            console.log(chalk.red('\n  Sign in with your Tera/Talocode account to use hosted Codra Code.'));
            console.log(chalk.gray('  Run: codra login'));
            console.log(chalk.gray('  Local providers (ollama, mock) are available without auth.\n'));
            // proceed to repl anyway for local feel, gating inside
        }
        const { canShowTui } = await import('./ui/home.js');
        const useTui = options.tui !== false && canShowTui();
        startRepl(false, useTui);
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
    // Check auth for protected commands - relaxed for local
    const usingHosted = !isLocalProvider(config.provider);
    const isPublic = input.startsWith('/login') || input.startsWith('/logout') ||
        input.startsWith('/auth') || input.startsWith('/help') ||
        input.startsWith('/skills') || input.startsWith('/skill') ||
        input.startsWith('/setup') || input.startsWith('/model') || input.startsWith('/provider') || input.startsWith('/status');
    if (usingHosted && !isPublic && !isAuthenticated()) {
        console.log(chalk.red('\n  Sign in with your Tera/Talocode account to use hosted Codra Code.'));
        console.log(chalk.gray('  Run: codra login\n'));
        process.exit(1);
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
        if (usingHosted && !isAuthenticated()) {
            console.log(chalk.red('\n  Hosted usage blocked. Sign in first: codra login\n'));
            process.exit(1);
        }
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
program.parseAsync(process.argv).then(() => {
    if (process.stdin.isTTY)
        return;
    process.exit(0);
}).catch(() => process.exit(1));
