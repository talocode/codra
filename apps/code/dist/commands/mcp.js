import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
function loadMcpConfig() {
    const configPaths = [
        path.join(process.cwd(), '.codra/mcp.json'),
        path.join(require('os').homedir(), '.codra/mcp.json')
    ];
    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf-8');
                return JSON.parse(content);
            }
            catch {
                continue;
            }
        }
    }
    return { servers: {} };
}
export async function mcpCommand(args) {
    const subcommand = args[0] || 'list';
    switch (subcommand) {
        case 'list':
            await listServers();
            break;
        case 'status':
            await serverStatus(args[1]);
            break;
        case 'tools':
            await listTools(args[1]);
            break;
        case 'call':
            await callTool(args[1], args[2], args.slice(3).join(' '));
            break;
        default:
            await listServers();
    }
}
async function listServers() {
    console.log(chalk.cyan('\n  MCP Servers:'));
    const config = loadMcpConfig();
    const servers = Object.entries(config.servers);
    if (servers.length === 0) {
        console.log(chalk.gray('  No servers configured.'));
        console.log(chalk.gray('  Configure in .codra/mcp.json or ~/.codra/mcp.json'));
    }
    else {
        servers.forEach(([name, server]) => {
            console.log(chalk.gray(`  - ${name}: ${server.command}`));
        });
    }
    console.log('');
}
async function serverStatus(name) {
    if (!name) {
        console.log(chalk.red('\n  Usage: /mcp status <server-name>\n'));
        return;
    }
    const config = loadMcpConfig();
    const server = config.servers[name];
    if (!server) {
        console.log(chalk.red(`\n  Server not found: ${name}\n`));
        return;
    }
    console.log(chalk.cyan(`\n  Server: ${name}`));
    console.log(chalk.gray(`  Command: ${server.command}`));
    console.log(chalk.gray(`  Args: ${server.args?.join(' ') || 'None'}`));
    // Check if command exists
    try {
        execSync(`which ${server.command}`, { encoding: 'utf-8' });
        console.log(chalk.gray('  Status: Command available'));
    }
    catch {
        console.log(chalk.red('  Status: Command not found'));
    }
    console.log('');
}
async function listTools(name) {
    if (!name) {
        console.log(chalk.red('\n  Usage: /mcp tools <server-name>\n'));
        return;
    }
    const config = loadMcpConfig();
    const server = config.servers[name];
    if (!server) {
        console.log(chalk.red(`\n  Server not found: ${name}\n`));
        return;
    }
    console.log(chalk.cyan(`\n  Tools for ${name}:`));
    console.log(chalk.gray('  Tool listing requires server connection'));
    console.log(chalk.gray('  MCP transport not fully implemented in v0.1.2'));
    console.log('');
}
async function callTool(serverName, toolName, argsJson) {
    if (!serverName || !toolName) {
        console.log(chalk.red('\n  Usage: /mcp call <server> <tool> <json-args>\n'));
        return;
    }
    const config = loadMcpConfig();
    const server = config.servers[serverName];
    if (!server) {
        console.log(chalk.red(`\n  Server not found: ${serverName}\n`));
        return;
    }
    console.log(chalk.cyan(`\n  Calling ${toolName} on ${serverName}`));
    console.log(chalk.gray('  MCP transport not fully implemented in v0.1.2'));
    console.log(chalk.gray('  Tool execution requires live MCP server connection'));
    console.log('');
}
