export type TaskStatus =
  | "draft"
  | "planning"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "verifying"
  | "repair_planning"
  | "awaiting_repair_approval"
  | "repairing"
  | "completed"
  | "failed"
  | "cancelled";

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface TaskPlan {
  summary: string;
  steps: TaskStep[];
  filesToRead: string[];
  filesToModify: string[];
  commandsToRun: string[];
  riskLevel: string;
  requiresApproval: boolean;
}

export interface FileChange {
  path: string;
  changeType: string;
  approved: boolean;
  applied: boolean;
}

export interface CommandRun {
  command: string;
  cwd: string;
  status: string;
  exitCode?: number;
  stdoutPreview?: string;
  stderrPreview?: string;
}

export interface VerificationResult {
  success: boolean;
  summary: string;
  errors: string[];
}

export interface TaskEvent {
  id: string;
  taskId: string;
  timestamp: string;
  eventType: string;
  message: string;
}

export interface DetectedCommand {
  command: string;
  reason: string;
  riskLevel: string;
  allowed: boolean;
}

export interface WorkspaceFileNode {
  path: string;
  kind: "file" | "directory";
  size?: number;
  children?: WorkspaceFileNode[];
  language?: string;
}

export interface WorkspaceContext {
  workspacePath: string;
  isGitRepo: boolean;
  gitBranch?: string;
  gitStatusSummary?: string;
  detectedStack: string[];
  detectedPackageManagers: string[];
  detectedConfigFiles: string[];
  suggestedCommands: DetectedCommand[];
  fileTree: WorkspaceFileNode[];
  ignoredDirs: string[];
  scannedAt: string;
}

export interface Task {
  id: string;
  title: string;
  userPrompt: string;
  workspacePath: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  plan?: TaskPlan;
  repairPlan?: TaskPlan;
  changedFiles: FileChange[];
  commandsRun: CommandRun[];
  verificationResult?: VerificationResult;
  finalReport?: string;
  error?: string;
}
