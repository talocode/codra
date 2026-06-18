import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const MCP_CONFIGS = [
  path.join(process.cwd(), '.codra/mcp.json'),
  path.join(os.homedir(), '.codra/mcp.json')
];

export async function mcpCommand(args: string[]) {
  if (args.length === 0) {
    console.log(chalk.cyan('\n  MCP Servers:'));
    let found = false;
    
    for (const configPath of MCP_CONFIGS) {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.servers) {
          for (const [name, server] of Object.entries(config.servers)) {
            console.log(chalk.gray(`  - ${name}`));
            found = true;
          }
        }
      }
    }

    if (!found) {
      console.log(chalk.gray('  No MCP servers configured.'));
    }
    console.log('');
  } else if (args[0] === 'add') {
    console.log(chalk.gray('  MCP server addition not yet implemented.'));
    console.log(chalk.gray('  Please manually edit .codra/mcp.json'));
  }
}
