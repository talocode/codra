export interface PendingEdit {
  type: 'append' | 'patch';
  path: string;
  fullPath: string;
  content: string;
  timestamp: string;
}

let pendingEdits: PendingEdit[] = [];

export function addPendingEdit(edit: PendingEdit): void {
  pendingEdits.push(edit);
}

export function getPendingEdits(): PendingEdit[] {
  return [...pendingEdits];
}

export function applyPendingEdits(): void {
  pendingEdits = [];
}

export function discardPendingEdits(): void {
  pendingEdits = [];
}
