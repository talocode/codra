import type { Message } from '../providers/types.js';
export interface SessionEntry {
    timestamp: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    command?: string;
    provider?: string;
    model?: string;
    metadata?: Record<string, unknown>;
}
export interface Session {
    id: string;
    startTime: string;
    entries: SessionEntry[];
    filePath: string;
}
export declare function createSession(): Session;
export declare function saveSessionEntry(session: Session, entry: SessionEntry): void;
export declare function loadSession(filePath: string): SessionEntry[];
export declare function listSessions(): string[];
export declare function getSessionPath(sessionId: string): string;
export declare function messagesToSessionEntries(messages: Message[], provider?: string, model?: string): SessionEntry[];
