import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpServerConnection {
  client: Client;
  transport: StdioClientTransport;
  tools: McpTool[];
}

const connections: Map<string, McpServerConnection> = new Map();

export async function connectToServer(
  name: string,
  command: string,
  args?: string[],
  env?: Record<string, string>
): Promise<McpServerConnection> {
  if (connections.has(name)) {
    return connections.get(name)!;
  }

  const transport = new StdioClientTransport({
    command,
    args: args || [],
    env: env ? { ...process.env, ...env } as Record<string, string> : undefined
  });

  const client = new Client(
    { name: 'codra-code', version: '0.1.2' },
    { capabilities: {} }
  );

  await client.connect(transport);

  const toolsResult = await client.listTools();
  const tools: McpTool[] = toolsResult.tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema as Record<string, unknown>
  }));

  const connection: McpServerConnection = { client, transport, tools };
  connections.set(name, connection);

  return connection;
}

export async function disconnectFromServer(name: string): Promise<void> {
  const connection = connections.get(name);
  if (connection) {
    await connection.client.close();
    connections.delete(name);
  }
}

export async function callTool(
  serverName: string,
  toolName: string,
  args?: Record<string, unknown>
): Promise<unknown> {
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

export function getConnectedServers(): string[] {
  return Array.from(connections.keys());
}

export function isServerConnected(name: string): boolean {
  return connections.has(name);
}
