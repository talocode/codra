export interface CommandResult {
    command: string;
    output: string;
    timestamp: string;
}
export declare function setLastCommandResult(result: CommandResult): void;
export declare function getLastCommandResult(): CommandResult | null;
