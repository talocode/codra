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
export declare function connectToServer(name: string, command: string, args?: string[], env?: Record<string, string>): Promise<McpServerConnection>;
export declare function disconnectFromServer(name: string): Promise<void>;
export declare function callTool(serverName: string, toolName: string, args?: Record<string, unknown>): Promise<unknown>;
export declare function getConnectedServers(): string[];
export declare function isServerConnected(name: string): boolean;
