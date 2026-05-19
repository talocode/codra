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
  files_to_read: string[];
  files_to_modify: string[];
  commands_to_run: string[];
  risk_level: string;
  requires_approval: boolean;
}

export interface FileChange {
  path: string;
  change_type: string;
  approved: boolean;
  applied: boolean;
}

export interface CommandRun {
  command: string;
  cwd: string;
  status: string;
  exit_code?: number;
  stdout_preview?: string;
  stderr_preview?: string;
}

export interface VerificationResult {
  success: boolean;
  summary: string;
  errors: string[];
}

export interface TaskEvent {
  id: string;
  task_id: string;
  timestamp: string;
  event_type: string;
  message: string;
}

export interface DetectedCommand {
  command: string;
  reason: string;
  risk_level: string;
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
  workspace_path: string;
  is_git_repo: boolean;
  git_branch?: string;
  git_status_summary?: string;
  detected_stack: string[];
  detected_package_managers: string[];
  detected_config_files: string[];
  suggested_commands: DetectedCommand[];
  file_tree: WorkspaceFileNode[];
  ignored_dirs: string[];
  scanned_at: string;
}

export interface Task {
  id: string;
  title: string;
  user_prompt: string;
  workspace_path: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  plan?: TaskPlan;
  repair_plan?: TaskPlan;
  changed_files: FileChange[];
  commands_run: CommandRun[];
  verification_result?: VerificationResult;
  final_report?: string;
  error?: string;
}
