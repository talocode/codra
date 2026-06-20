export type ToolCategory = 'file' | 'shell' | 'git' | 'provider' | 'mcp' | 'plugin' | 'plan' | 'activity' | 'context' | 'permission' | 'other';
export type ToolCallStatus = 'started' | 'completed' | 'failed' | 'skipped';
export type RiskLevel = 'low' | 'medium' | 'high';
export interface ToolCall {
    id: string;
    threadId?: string;
    planId?: string;
    sessionId?: string;
    tool: string;
    category: ToolCategory;
    inputSummary: string;
    outputSummary: string;
    status: ToolCallStatus;
    startedAt: string;
    endedAt?: string;
    durationMs?: number;
    error?: string;
    riskLevel: RiskLevel;
    permissionLevel: string;
    redacted: boolean;
}
