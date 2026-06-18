import { helpCommand } from './help';
import { statusCommand } from './status';
import { modelCommand } from './model';
import { providerCommand } from './provider';
import { skillsCommand } from './skills';
import { mcpCommand } from './mcp';
import { pluginsCommand } from './plugins';
import { filesCommand } from './files';
import { readCommand } from './read';
import { writeCommand } from './write';
import { runCommand } from './run';
import { clearCommand } from './clear';
import { exitCommand } from './exit';

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
    default:
      console.log(`Unknown command: ${command}. Type /help for available commands.`);
  }
}
