let pendingEdits = [];
export function addPendingEdit(edit) {
    pendingEdits.push(edit);
}
export function getPendingEdits() {
    return [...pendingEdits];
}
export function applyPendingEdits() {
    pendingEdits = [];
}
export function discardPendingEdits() {
    pendingEdits = [];
}
