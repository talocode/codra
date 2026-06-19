import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const connections = new Map();
export async function connectToServer(name, command, args, env) {
    if (connections.has(name)) {
        return connections.get(name);
    }
    const transport = new StdioClientTransport({
        command,
        args: args || [],
        env: env ? { ...process.env, ...env } : undefined
    });
    const client = new Client({ name: 'codra-code', version: '0.1.2' }, { capabilities: {} });
    await client.connect(transport);
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
    }));
    const connection = { client, transport, tools };
    connections.set(name, connection);
    return connection;
}
export async function disconnectFromServer(name) {
    const connection = connections.get(name);
    if (connection) {
        await connection.client.close();
        connections.delete(name);
    }
}
export async function callTool(serverName, toolName, args) {
    const connection = connections.get(serverName);
    if (!connection) {
        throw new Error(`Server not connected: ${serverName}`);
    }
    const result = await connection.client.callTool({
        name: toolName,
        arguments: args || {}
    });
    return result.content;
}
export function getConnectedServers() {
    return Array.from(connections.keys());
}
export function isServerConnected(name) {
    return connections.has(name);
}
