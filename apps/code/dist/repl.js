import * as readline from 'readline';
import chalk from 'chalk';
import { handleCommand } from './commands/index.js';
import { getConfig } from './config.js';
import { createProvider } from './providers/index.js';
import { createSession, saveSessionEntry } from './session/index.js';
let currentSession;
let messageHistory = [];
let currentProvider;
let fileContext = [];
export function getFileContext() {
    return fileContext;
}
export function addFileContext(content) {
    fileContext.push(content);
}
export function clearFileContext() {
    fileContext = [];
}
export async function startRepl(mockMode = false) {
    const config = getConfig();
    try {
        currentProvider = createProvider(config.provider, {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey
        });
    }
    catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.log(chalk.yellow(`\n  Warning: ${errorMessage}`));
        console.log(chalk.gray('  Falling back to mock mode.\n'));
        currentProvider = createProvider('mock');
        config.provider = 'mock';
        config.mockMode = true;
    }
    currentSession = createSession();
    console.log(chalk.cyan('\n  Codra Code v0.1.1'));
    console.log(chalk.gray('  A local-first, open-source coding agent interface'));
    console.log(chalk.gray(`  Provider: ${config.provider} | Model: ${config.model}`));
    console.log(chalk.gray('  Type "/help" for available commands.\n'));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.green('› ')
    });
    rl.prompt();
    rl.on('line', async (line) => {
        const input = line.trim();
        if (input) {
            if (input.startsWith('/')) {
                await handleCommand(input);
            }
            else {
                await handleUserMessage(input);
            }
        }
        rl.prompt();
    });
    rl.on('close', () => {
        console.log(chalk.cyan('\n  Session saved. Exiting Codra Code. Goodbye!\n'));
        process.exit(0);
    });
}
async function handleUserMessage(input) {
    const config = getConfig();
    saveSessionEntry(currentSession, {
        timestamp: new Date().toISOString(),
        role: 'user',
        content: input,
        provider: config.provider,
        model: config.model
    });
    messageHistory.push({ role: 'user', content: input });
    try {
        const messages = [];
        if (fileContext.length > 0) {
            const contextContent = fileContext.join('\n\n');
            messages.push({
                role: 'system',
                content: `You have access to the following file context:\n\n${contextContent}\n\nPlease use this context to help answer the user's questions.`
            });
        }
        messages.push(...messageHistory);
        const response = await currentProvider.chat(messages, config.model);
        console.log(chalk.cyan('\n  Codra:'));
        console.log(chalk.white(`  ${response.content}\n`));
        saveSessionEntry(currentSession, {
            timestamp: new Date().toISOString(),
            role: 'assistant',
            content: response.content,
            provider: response.provider,
            model: response.model,
            metadata: response.usage ? { usage: response.usage } : undefined
        });
        messageHistory.push({ role: 'assistant', content: response.content });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(chalk.red(`\n  Error: ${errorMessage}\n`));
        saveSessionEntry(currentSession, {
            timestamp: new Date().toISOString(),
            role: 'system',
            content: `Error: ${errorMessage}`,
            metadata: { error: true }
        });
    }
}
export function getCurrentSession() {
    return currentSession;
}
export function getMessageHistory() {
    return messageHistory;
}
