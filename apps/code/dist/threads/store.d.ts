import { Thread } from './types.js';
export declare function saveThread(thread: Thread): void;
export declare function getThread(id: string): Thread | null;
export declare function listThreads(): Thread[];
export declare function deleteThread(id: string): boolean;
