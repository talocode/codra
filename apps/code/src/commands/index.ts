import chalk from 'chalk';
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
import { doctorCommand } from './doctor.js';
import { gitCommand } from './git.js';
import { appendCommand, patchCommand, diffCommand, pendingCommand, applyCommand, discardCommand } from './file-edit.js';
import { pluginCommand } from './plugin.js';
import { watchCommand } from './watch.js';
import { planCommand } from './plan.js';
import { plansCommand } from './plans.js';
import { threadCommand, threadsCommand } from './thread.js';
import { contextCommand } from './context.js';
import { permissionsCommand } from './permissions.js';
import { activityCommand } from './activity.js';
import { toolsCommand } from './tools.js';
import { visualPlanCommand, visualPlansCommand } from './visualPlan.js';
import { setupCommand } from './setup.js';
import { isAuthenticated, startLogin, clearAuthToken, authStatus } from '../auth/index.js';

// Commands that don't require authentication
const PUBLIC_COMMANDS = ['/help', '/login', '/logout', '/auth', '/auth status', '/auth:token-path', '/skills', '/skill', '/setup', '/model', '/provider', '/status', '/clear', '/exit'];

export async function handleCommand(input: string) {
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Check authentication for protected commands
  if (!PUBLIC_COMMANDS.includes(command) && !isAuthenticated()) {
    console.log(chalk.red('\n  Codra Code requires a Tera account.'));
    console.log(chalk.gray('  Run: codra login or /login'));
    console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin\n'));
    return;
  }

  switch (command) {
    case '/help':
      await helpCommand();
      break;
    case '/login':
      await startLogin();
      break;
    case '/logout':
      await clearAuthToken();
      console.log(chalk.green('\n  ✓ Signed out successfully.\n'));
      break;
    case '/auth':
    case '/auth status':
      await authStatus();
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
    case '/doctor':
      await doctorCommand();
      break;
    case '/skills':
      await skillsCommand(args);
      break;
    case '/skill':
      await skillCommand(args);
      break;
    case '/mcp':
      await mcpCommand(args);
      break;
    case '/plugins':
      await pluginsCommand();
      break;
    case '/plugin':
      await pluginCommand(args);
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
    case '/append':
      await appendCommand(args);
      break;
    case '/patch':
      await patchCommand(args);
      break;
    case '/diff':
      await diffCommand(args);
      break;
    case '/pending':
      await pendingCommand();
      break;
    case '/apply':
      await applyCommand();
      break;
    case '/discard':
      await discardCommand();
      break;
    case '/run':
      await runCommand(args);
      break;
    case '/git':
      await gitCommand(args);
      break;
    case '/watch':
      await watchCommand(args);
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
    case '/last':
      await lastCommand();
      break;
    case '/plan':
      await planCommand(args);
      break;
    case '/plans':
      await plansCommand();
      break;
    case '/thread':
      await threadCommand(args);
      break;
    case '/threads':
      await threadsCommand();
      break;
    case '/context':
      await contextCommand(args);
      break;
    case '/permissions':
      await permissionsCommand(args);
      break;
    case '/activity':
      await activityCommand(args);
      break;
    case '/tools':
      await toolsCommand(args);
      break;
    case '/visual-plan':
      await visualPlanCommand(args);
      break;
    case '/visual-plans':
      await visualPlansCommand();
      break;
    case '/visual-recap':
      await visualPlanCommand(args);
      break;
    case '/setup':
      await setupCommand(args);
      break;
    case '/project':
      console.log(chalk.gray('\n  /project is not fully wired yet in this build. Use normal chat or /status for workspace info.\n'));
      break;
    case '/build':
      console.log(chalk.gray('\n  /build is not wired yet in this build. Use a normal instruction or /plan first.\n'));
      break;
    case '/review':
      console.log(chalk.gray('\n  /review is not wired yet in this build. Describe what to review in chat.\n'));
      break;
    case '/test':
      console.log(chalk.gray('\n  /test is not wired yet in this build. Use /run or normal prompt for test commands.\n'));
      break;
    case '/commit':
      console.log(chalk.gray('\n  /commit is not wired yet in this build. Use /git or run git commands via /run.\n'));
      break;
    default:
      console.log(`Unknown command: ${command}. Type /help for available commands.`);
  }
}

async function skillCommand(args: string[]) {
  if (args.length === 0) {
    console.log(chalk.gray('\n  Usage: /skill <name> | /skill clear\n'));
    return;
  }
  
  const { setActiveSkill, clearActiveSkill, getActiveSkill } = await import('../skills/active.js');
  
  if (args[0] === 'clear') {
    clearActiveSkill();
    console.log(chalk.green('\n  Active skill cleared\n'));
    return;
  }
  
  const skillName = args[0];
  const { loadSkill } = await import('../skills/loader.js');
  const skill = await loadSkill(skillName);
  
  if (skill) {
    setActiveSkill(skillName, skill);
    console.log(chalk.green(`\n  Active skill: ${skillName}\n`));
  } else {
    console.log(chalk.red(`\n  Skill not found: ${skillName}\n`));
  }
}

async function lastCommand() {
  const { getLastCommandResult } = await import('../session/commands.js');
  const result = getLastCommandResult();
  
  if (result) {
    console.log(chalk.cyan('\n  Last Command Result:'));
    console.log(chalk.gray(`  Command: ${result.command}`));
    console.log(chalk.gray(`  Output: ${result.output}`));
  } else {
    console.log(chalk.gray('\n  No command results yet\n'));
  }
}
