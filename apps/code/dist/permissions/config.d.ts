export type PermissionLevel = 'read-only' | 'confirm-edits' | 'confirm-commands' | 'trusted-project';
export interface PermissionConfig {
    level: PermissionLevel;
    allowedTools: string[];
    ignoredFiles: string[];
    ignoredCommands: string[];
}
export declare function loadPermissionConfig(): PermissionConfig;
export declare function savePermissionConfig(config: PermissionConfig): void;
