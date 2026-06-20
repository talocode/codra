import { ToolCall } from './types.js';
export declare function logToolCall(toolCall: ToolCall): void;
export declare function getToolCalls(): ToolCall[];
export declare function getToolCallsByThread(threadId: string): ToolCall[];
export declare function getRecentToolCalls(count?: number): ToolCall[];
export declare function clearToolCalls(): void;
