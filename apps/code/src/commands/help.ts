import chalk from 'chalk';

export async function helpCommand() {
  console.log(chalk.cyan('\n  Codra Code Commands:'));
  console.log(chalk.gray('  /help                  Show this help message'));
  console.log(chalk.gray('  /status                Show project, provider, model, config status'));
  console.log(chalk.gray('  /model [name]          Show or change current model'));
  console.log(chalk.gray('  /provider [name]       Show or change current provider'));
  console.log(chalk.gray('  /skills                List installed skills'));
  console.log(chalk.gray('  /skill <name>          Open or activate a skill'));
  console.log(chalk.gray('  /mcp [add]             List MCP servers or add new one'));
  console.log(chalk.gray('  /plugins               List installed plugins'));
  console.log(chalk.gray('  /files                 Inspect project file tree'));
  console.log(chalk.gray('  /read <path>           Read a local file'));
  console.log(chalk.gray('  /write <path>          Create/update a file (with confirmation)'));
  console.log(chalk.gray('  /run <command>         Run shell command (with confirmation)'));
  console.log(chalk.gray('  /clear                 Clear current session view'));
  console.log(chalk.gray('  /exit                  Quit Codra Code'));
  console.log('');
}
