export interface CommandResult {
  command: string;
  output: string;
  timestamp: string;
}

let lastCommandResult: CommandResult | null = null;

export function setLastCommandResult(result: CommandResult): void {
  lastCommandResult = result;
}

export function getLastCommandResult(): CommandResult | null {
  return lastCommandResult;
}
