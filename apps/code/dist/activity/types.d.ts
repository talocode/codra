export type ActivityEventType = 'session_started' | 'session_ended' | 'thread_started' | 'thread_resumed' | 'command_run' | 'tool_call_started' | 'tool_call_completed' | 'file_inspected' | 'file_modified' | 'plan_created' | 'plan_approved' | 'plan_run' | 'validation_run' | 'error';
export interface ActivityEvent {
    id: string;
    type: ActivityEventType;
    timestamp: string;
    projectPath: string;
    threadId?: string;
    planId?: string;
    tool?: string;
    command?: string;
    file?: string;
    language?: string;
    durationMs?: number;
    status?: string;
    metadata?: Record<string, unknown>;
    redacted: boolean;
}
export interface ActivityConfig {
    enabled: boolean;
    mode: string;
    trackFiles: boolean;
    trackCommands: boolean;
    trackDurations: boolean;
    redactSecrets: boolean;
    ignoredFiles: string[];
    ignoredCommands: string[];
}
export declare const DEFAULT_ACTIVITY_CONFIG: ActivityConfig;
