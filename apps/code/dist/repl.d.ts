import type { Message } from './providers/types.js';
export declare function getFileContext(): string[];
export declare function addFileContext(content: string): void;
export declare function clearFileContext(): void;
export declare function startRepl(mockMode?: boolean, useTui?: boolean): Promise<void>;
export declare function getMessageHistory(): Message[];
