export interface PendingEdit {
    type: 'append' | 'patch';
    path: string;
    fullPath: string;
    content: string;
    timestamp: string;
}
export declare function addPendingEdit(edit: PendingEdit): void;
export declare function getPendingEdits(): PendingEdit[];
export declare function applyPendingEdits(): void;
export declare function discardPendingEdits(): void;
