// Shared types between frontend and backend representation
export interface AgentTask {
  id: string;
  title: string;
  status: "PENDING" | "RUNNING" | "WAITING_APPROVAL" | "COMPLETED" | "FAILED";
  description?: string;
}

export interface WorkspaceSummary {
  id: string;
  rootPath: string;
  metadata?: Record<string, string>;
}

export interface RepoSummary {
  workspaceId: string;
  name: string;
}

export interface GitStatusSummary {
  isGit: boolean;
  branch?: string;
  changedFiles: number;
}

export interface SearchQuery {
  pattern: string;
  directory?: string;
}

export interface SearchMatch {
  path: string;
  lineNumber: number;
  preview: string;
}

export interface FileReadResult {
  content: string;
}

export interface FileWriteRequest {
  path: string;
  content: string;
}

export interface FileWriteResult {
  success: boolean;
  checkpointId?: string;
  error?: string;
}

export interface CommandExecutionRequest {
  command: string;
  args: string[];
}

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CheckpointRecord {
  id: string;
  workspaceId: string;
  timestamp: string;
  targetPath: string;
  operationType: string;
  status: string;
}

export interface ApprovalRequirement {
  id: string;
  actionType: string;
  description: string;
}

export interface ApprovalDecision {
  requirementId: string;
  approved: boolean;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}
