import { helpCommand } from './help.js';
import { statusCommand } from './status.js';
import { modelCommand } from './model.js';
import { providerCommand } from './provider.js';
import { skillsCommand } from './skills.js';
import { mcpCommand } from './mcp.js';
import { pluginsCommand } from './plugins.js';
import { filesCommand } from './files.js';
import { readCommand } from './read.js';
import { writeCommand } from './write.js';
import { runCommand } from './run.js';
import { clearCommand } from './clear.js';
import { exitCommand } from './exit.js';
import { sessionsCommand } from './sessions.js';
import { sessionCommand } from './session.js';
import { saveCommand } from './save.js';
import { configCommand } from './config.js';

export async function handleCommand(input: string) {
  const [command, ...args] = input.trim().split(' ');

  switch (command.toLowerCase()) {
    case '/help':
      await helpCommand();
      break;
    case '/status':
      await statusCommand();
      break;
    case '/model':
      await modelCommand(args);
      break;
    case '/provider':
      await providerCommand(args);
      break;
    case '/config':
      await configCommand();
      break;
    case '/skills':
      await skillsCommand();
      break;
    case '/mcp':
      await mcpCommand(args);
      break;
    case '/plugins':
      await pluginsCommand();
      break;
    case '/files':
      await filesCommand();
      break;
    case '/read':
      await readCommand(args);
      break;
    case '/write':
      await writeCommand(args);
      break;
    case '/run':
      await runCommand(args);
      break;
    case '/clear':
      await clearCommand();
      break;
    case '/exit':
      await exitCommand();
      break;
    case '/sessions':
      await sessionsCommand();
      break;
    case '/session':
      await sessionCommand();
      break;
    case '/save':
      await saveCommand();
      break;
    default:
      console.log(`Unknown command: ${command}. Type /help for available commands.`);
  }
}
