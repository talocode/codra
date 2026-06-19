import type { Message } from './providers/types.js';
import type { Session } from './session/index.js';
export declare function getFileContext(): string[];
export declare function addFileContext(content: string): void;
export declare function clearFileContext(): void;
export declare function startRepl(mockMode?: boolean): Promise<void>;
export declare function getCurrentSession(): Session;
export declare function getMessageHistory(): Message[];
