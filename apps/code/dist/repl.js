import * as readline from 'readline';
import chalk from 'chalk';
import { handleCommand } from './commands/index.js';
import { getConfig } from './config.js';
import { createProvider } from './providers/index.js';
import { createSession, saveSessionEntry } from './session/index.js';
import { setCurrentSession, getCurrentSession } from './session/state.js';
import { getActiveSkillContext } from './skills/active.js';
import { isAuthenticated, getAuthToken } from './auth/index.js';
import { isLocalProvider, getModeLabel } from './providers/index.js';
let messageHistory = [];
let currentProvider;
let fileContext = [];
const SYSTEM_PROMPT = `You are Codra Code, a local-first, open-source coding agent for real software work.

Core principles:
- You are a local-first assistant. Your code and data stay on the user's machine.
- Do not invent file contents. Always ask to read files first.
- Ask before making destructive changes.
- Prefer small, safe, incremental changes.
- Explain commands before running them.
- Never expose secrets or sensitive information.
- Respect the project context and existing code patterns.
- Be concise and helpful.
- When suggesting file changes, use the /write, /append, or /patch commands.
- When running commands, use the /run command with confirmation.

You have access to:
- File reading and editing capabilities
- Git integration
- Command execution (with confirmation)
- Project context and skills
- Session persistence

Always prioritize safety and user control.`;
export function getFileContext() {
    return fileContext;
}
export function addFileContext(content) {
    fileContext.push(content);
}
export function clearFileContext() {
    fileContext = [];
}
export async function startRepl(mockMode = false, useTui = false) {
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
    const session = createSession();
    setCurrentSession(session);
    // Improved header per v0.4
    printCodraHeader(config);
    if (useTui) {
        const { renderHomeScreen } = await import('./ui/home.js');
        renderHomeScreen();
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.green('› ')
    });
    rl.prompt();
    rl.on('line', async (line) => {
        const input = line.trim();
        if (input) {
            if (input === '/') {
                await showCommandPicker();
            }
            else if (input.startsWith('/')) {
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
function printCodraHeader(config) {
    const cwd = process.cwd();
    const auth = getAuthToken();
    const authLabel = auth ? `signed in as ${auth.email}` : 'not signed in';
    const mode = getModeLabel(config.provider);
    const hostedNote = mode === 'hosted' ? ' (requires auth for full use)' : '';
    console.log(chalk.cyan('\n  Codra Code'));
    console.log(chalk.gray(`  Workspace: ${cwd}`));
    console.log(chalk.gray(`  Mode: ${mode}${hostedNote}`));
    console.log(chalk.gray(`  Auth: ${authLabel}`));
    console.log(chalk.gray(`  Provider: ${config.provider}`));
    console.log(chalk.gray(`  Model: ${config.model || 'not set'}`));
    console.log(chalk.gray(`  Context: ${fileContext.length} files loaded`));
    console.log(chalk.gray('  Commands: type / for interactive menu, /help for list\n'));
}
async function showCommandPicker() {
    console.log(chalk.cyan('\n  Codra Code — Command Menu (type number or /cmd)'));
    console.log(chalk.gray('  Auth & System:'));
    const cmds = [
        { cmd: '/help', desc: 'Show full help' },
        { cmd: '/status', desc: 'Show workspace, auth, model status' },
        { cmd: '/auth', desc: 'Authentication status' },
        { cmd: '/login', desc: 'Sign in with Tera account' },
        { cmd: '/logout', desc: 'Sign out' },
        { cmd: '/model', desc: 'Model & provider picker' },
        { cmd: '/provider', desc: 'Switch provider' },
        { cmd: '/clear', desc: 'Clear session' },
        { cmd: '/exit', desc: 'Quit' },
    ];
    cmds.forEach((c, i) => console.log(chalk.gray(`    ${i + 1}. ${c.cmd}  ${c.desc}`)));
    console.log(chalk.gray('\n  Coding:'));
    const codingCmds = [
        { cmd: '/project', desc: 'Project info' },
        { cmd: '/files', desc: 'List files' },
        { cmd: '/plan', desc: 'Create plan' },
        { cmd: '/build', desc: 'Build action (not wired yet)' },
        { cmd: '/review', desc: 'Code review (not wired yet)' },
        { cmd: '/test', desc: 'Run tests (not wired yet)' },
        { cmd: '/commit', desc: 'Git commit (not wired yet)' },
    ];
    codingCmds.forEach((c, i) => console.log(chalk.gray(`    ${cmds.length + i + 1}. ${c.cmd}  ${c.desc}`)));
    console.log(chalk.gray('\n  0. Cancel / close menu\n'));
    const choice = await ask('  Select: ');
    const num = parseInt(choice.trim(), 10);
    if (isNaN(num) || num === 0) {
        return;
    }
    let selected = '';
    if (num >= 1 && num <= cmds.length) {
        selected = cmds[num - 1].cmd;
    }
    else if (num > cmds.length && num <= cmds.length + codingCmds.length) {
        selected = codingCmds[num - cmds.length - 1].cmd;
    }
    if (selected) {
        console.log('');
        await handleCommand(selected);
    }
    else {
        console.log(chalk.yellow('  Unknown selection.'));
    }
}
function ask(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
async function handleUserMessage(input) {
    const config = getConfig();
    // Gate hosted usage
    if (!isLocalProvider(config.provider) && !isAuthenticated()) {
        console.log(chalk.red('\n  Hosted coding requires Tera account.'));
        console.log(chalk.gray('  Run: /login   or use local provider (ollama/mock)\n'));
        return;
    }
    saveSessionEntry(getCurrentSession(), {
        timestamp: new Date().toISOString(),
        role: 'user',
        content: input,
        provider: config.provider,
        model: config.model
    });
    messageHistory.push({ role: 'user', content: input });
    try {
        const messages = [];
        // Build system prompt with active skills
        let systemPrompt = SYSTEM_PROMPT;
        const skillContext = getActiveSkillContext(12000);
        if (skillContext) {
            systemPrompt += `\n\nActive Skills:\n${skillContext}`;
        }
        messages.push({ role: 'system', content: systemPrompt });
        // Add file context if any
        if (fileContext.length > 0) {
            const contextContent = fileContext.join('\n\n');
            messages.push({
                role: 'system',
                content: `You have access to the following file context:\n\n${contextContent}\n\nPlease use this context to help answer the user's questions. Do not invent file contents - use what is provided.`
            });
        }
        // Add conversation history
        messages.push(...messageHistory);
        const response = await currentProvider.chat(messages, config.model);
        console.log(chalk.cyan('\n  Codra:'));
        console.log(chalk.white(`  ${response.content}\n`));
        saveSessionEntry(getCurrentSession(), {
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
        saveSessionEntry(getCurrentSession(), {
            timestamp: new Date().toISOString(),
            role: 'system',
            content: `Error: ${errorMessage}`,
            metadata: { error: true }
        });
    }
}
export function getMessageHistory() {
    return messageHistory;
}
