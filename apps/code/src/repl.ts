import * as readline from 'readline';
import chalk from 'chalk';
import { handleCommand } from './commands/index.js';
import { getConfig } from './config.js';
import { createProvider } from './providers/index.js';
import type { Provider, Message } from './providers/types.js';
import { createSession, saveSessionEntry } from './session/index.js';
import type { Session } from './session/index.js';
import { getActiveSkill } from './skills/active.js';

let currentSession: Session;
let messageHistory: Message[] = [];
let currentProvider: Provider;
let fileContext: string[] = [];

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

export function getFileContext(): string[] {
  return fileContext;
}

export function addFileContext(content: string): void {
  fileContext.push(content);
}

export function clearFileContext(): void {
  fileContext = [];
}

export async function startRepl(mockMode: boolean = false): Promise<void> {
  const config = getConfig();
  
  try {
    currentProvider = createProvider(config.provider, {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.log(chalk.yellow(`\n  Warning: ${errorMessage}`));
    console.log(chalk.gray('  Falling back to mock mode.\n'));
    currentProvider = createProvider('mock');
    config.provider = 'mock';
    config.mockMode = true;
  }

  currentSession = createSession();

  const modeLabel = config.mockMode ? 'Test Mode' : 'Production';
  console.log(chalk.cyan('\n  Codra Code v0.2.1'));
  console.log(chalk.gray('  A local-first, open-source coding agent for real software work'));
  console.log(chalk.gray(`  Provider: ${config.provider} | Model: ${config.model} | Mode: ${modeLabel}`));
  console.log(chalk.gray('  Type "/help" for available commands.\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('› ')
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();
    if (input) {
      if (input.startsWith('/')) {
        await handleCommand(input);
      } else {
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

async function handleUserMessage(input: string): Promise<void> {
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
    const messages: Message[] = [];

    // Build system prompt with skill if active
    let systemPrompt = SYSTEM_PROMPT;
    const activeSkill = getActiveSkill();
    if (activeSkill) {
      systemPrompt += `\n\nActive skill "${activeSkill.name}":\n${activeSkill.content}`;
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

    saveSessionEntry(currentSession, {
      timestamp: new Date().toISOString(),
      role: 'assistant',
      content: response.content,
      provider: response.provider,
      model: response.model,
      metadata: response.usage ? { usage: response.usage } : undefined
    });

    messageHistory.push({ role: 'assistant', content: response.content });

  } catch (error) {
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

export function getCurrentSession(): Session {
  return currentSession;
}

export function getMessageHistory(): Message[] {
  return messageHistory;
}
