import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { connectToServer, disconnectFromServer, callTool, isServerConnected, getConnectedServers } from '../mcp/client.js';
import * as readline from 'readline';
function loadMcpConfig() {
    const configPaths = [
        path.join(process.cwd(), '.codra/mcp.json'),
        path.join(os.homedir(), '.codra/mcp.json')
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
function askConfirmation(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(chalk.yellow(`  ${question} (y/N) `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
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
            await callToolCommand(args[1], args[2], args.slice(3).join(' '));
            break;
        case 'connect':
            await connectServer(args[1]);
            break;
        case 'disconnect':
            await disconnectServer(args[1]);
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
            const connected = isServerConnected(name);
            const status = connected ? chalk.green('Connected') : chalk.gray('Disconnected');
            console.log(chalk.gray(`  - ${name}: ${server.command} [${status}]`));
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
    const connected = isServerConnected(name);
    console.log(chalk.gray(`  Status: ${connected ? 'Connected' : 'Disconnected'}`));
    if (connected) {
        const servers = getConnectedServers();
        console.log(chalk.gray(`  Connected servers: ${servers.join(', ')}`));
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
    if (!isServerConnected(name)) {
        console.log(chalk.yellow(`\n  Server ${name} is not connected.`));
        console.log(chalk.gray('  Use /mcp connect <name> to connect first\n'));
        return;
    }
    console.log(chalk.cyan(`\n  Tools for ${name}:`));
    try {
        const connection = await connectToServer(name, server.command, server.args, server.env);
        connection.tools.forEach(tool => {
            console.log(chalk.gray(`  - ${tool.name}: ${tool.description || 'No description'}`));
        });
    }
    catch (e) {
        console.log(chalk.red(`  Error listing tools: ${e}`));
    }
    console.log('');
}
async function connectServer(name) {
    if (!name) {
        console.log(chalk.red('\n  Usage: /mcp connect <server-name>\n'));
        return;
    }
    const config = loadMcpConfig();
    const server = config.servers[name];
    if (!server) {
        console.log(chalk.red(`\n  Server not found: ${name}\n`));
        return;
    }
    if (isServerConnected(name)) {
        console.log(chalk.yellow(`\n  Server ${name} is already connected\n`));
        return;
    }
    console.log(chalk.cyan(`\n  Connecting to ${name}...`));
    console.log(chalk.gray(`  Command: ${server.command} ${(server.args || []).join(' ')}`));
    const confirm = await askConfirmation(`Connect to MCP server ${name}?`);
    if (!confirm) {
        console.log(chalk.gray('\n  Connection cancelled\n'));
        return;
    }
    try {
        await connectToServer(name, server.command, server.args, server.env);
        console.log(chalk.green(`\n  Connected to ${name}\n`));
    }
    catch (e) {
        console.log(chalk.red(`\n  Connection failed: ${e}\n`));
    }
}
async function disconnectServer(name) {
    if (!name) {
        console.log(chalk.red('\n  Usage: /mcp disconnect <server-name>\n'));
        return;
    }
    if (!isServerConnected(name)) {
        console.log(chalk.yellow(`\n  Server ${name} is not connected\n`));
        return;
    }
    try {
        await disconnectFromServer(name);
        console.log(chalk.green(`\n  Disconnected from ${name}\n`));
    }
    catch (e) {
        console.log(chalk.red(`\n  Disconnect failed: ${e}\n`));
    }
}
async function callToolCommand(serverName, toolName, argsJson) {
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
    if (!isServerConnected(serverName)) {
        console.log(chalk.yellow(`\n  Server ${serverName} is not connected.`));
        console.log(chalk.gray('  Use /mcp connect <name> to connect first\n'));
        return;
    }
    let args = {};
    if (argsJson) {
        try {
            args = JSON.parse(argsJson);
        }
        catch {
            console.log(chalk.red('\n  Invalid JSON arguments\n'));
            return;
        }
    }
    console.log(chalk.cyan(`\n  Calling ${toolName} on ${serverName}`));
    const confirm = await askConfirmation(`Execute tool ${toolName}?`);
    if (!confirm) {
        console.log(chalk.gray('\n  Tool call cancelled\n'));
        return;
    }
    try {
        const result = await callTool(serverName, toolName, args);
        console.log(chalk.green('\n  Tool result:'));
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        console.log(chalk.red(`\n  Tool call failed: ${e}`));
    }
    console.log('');
}
