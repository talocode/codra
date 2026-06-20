import chalk from 'chalk';
import { loadPermissionConfig, savePermissionConfig, PermissionLevel } from '../permissions/config.js';

export async function permissionsCommand(args: string[]) {
  if (args.length === 0) {
    const config = loadPermissionConfig();
    console.log(chalk.cyan('\n  Permission Policy:'));
    console.log(chalk.gray(`  Level: ${config.level}`));
    console.log(chalk.gray(`  Allowed Tools: ${config.allowedTools.length > 0 ? config.allowedTools.join(', ') : 'none'}`));
    console.log(chalk.gray(`  Ignored Files: ${config.ignoredFiles.join(', ')}`));
    console.log('');
    return;
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'set':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /permissions set <level>\n'));
        console.log(chalk.gray('  Levels: read-only, confirm-edits, confirm-commands, trusted-project\n'));
        return;
      }
      const level = args[1] as PermissionLevel;
      const validLevels = ['read-only', 'confirm-edits', 'confirm-commands', 'trusted-project'];
      if (!validLevels.includes(level)) {
        console.log(chalk.red(`\n  Invalid level: ${level}`));
        console.log(chalk.gray(`  Valid levels: ${validLevels.join(', ')}\n`));
        return;
      }
      const config = loadPermissionConfig();
      config.level = level;
      savePermissionConfig(config);
      console.log(chalk.green(`\n  Permission level set to: ${level}\n`));
      break;

    case 'allow':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /permissions allow <tool>\n'));
        return;
      }
      const tool = args[1];
      const allowConfig = loadPermissionConfig();
      if (!allowConfig.allowedTools.includes(tool)) {
        allowConfig.allowedTools.push(tool);
        savePermissionConfig(allowConfig);
        console.log(chalk.green(`\n  Tool allowed: ${tool}\n`));
      } else {
        console.log(chalk.gray(`\n  Tool already allowed: ${tool}\n`));
      }
      break;

    case 'reset':
      const resetConfig = {
        level: 'confirm-edits' as const,
        allowedTools: [],
        ignoredFiles: ['.env', '.env.*', '*.pem', '*.key'],
        ignoredCommands: []
      };
      savePermissionConfig(resetConfig);
      console.log(chalk.green('\n  Permissions reset to defaults.\n'));
      break;

    default:
      console.log(chalk.gray('\n  Usage: /permissions | /permissions set <level> | /permissions allow <tool> | /permissions reset\n'));
      break;
  }
}
