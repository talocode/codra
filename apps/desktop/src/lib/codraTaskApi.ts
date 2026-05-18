import { invoke } from '@tauri-apps/api/core';

// Types matching codra-protocol
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

export type TaskStatus =
  | 'Draft'
  | 'Planning'
  | 'AwaitingApproval'
  | 'Approved'
  | 'Executing'
  | 'Verifying'
  | 'RepairPlanning'
  | 'AwaitingRepairApproval'
  | 'Repairing'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export interface TaskPlan {
  summary: string;
  steps: TaskStep[];
  files_to_read: string[];
  files_to_modify: string[];
  commands_to_run: string[];
  risk_level: string;
  requires_approval: boolean;
}

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: string;
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

export interface WorkspaceContext {
  workspace_path: string;
  is_git_repo: boolean;
  git_branch?: string;
  git_status_summary?: string;
  detected_stack: string[];
  detected_config_files: string[];
  suggested_commands: DetectedCommand[];
  file_tree: WorkspaceFileNode[];
}

export interface DetectedCommand {
  command: string;
  reason: string;
  risk_level: string;
  allowed: boolean;
}

export interface WorkspaceFileNode {
  path: string;
  kind: 'file' | 'directory';
  size?: number;
  children?: WorkspaceFileNode[];
  language?: string;
}

// API Functions
export async function createTask(input: {
  workspace_path: string;
  user_prompt: string;
  title?: string;
}): Promise<Task> {
  return invoke('codra_create_task', input);
}

export async function listTasks(): Promise<Task[]> {
  return invoke('codra_list_tasks');
}

export async function getTask(taskId: string): Promise<Task> {
  return invoke('codra_get_task', { taskId });
}

export async function getTaskEvents(taskId: string): Promise<TaskEvent[]> {
  return invoke('codra_get_task_events', { taskId });
}

export async function scanWorkspace(workspacePath: string): Promise<WorkspaceContext> {
  return invoke('codra_scan_workspace', { workspacePath });
}

export async function approveTask(taskId: string): Promise<Task> {
  return invoke('codra_approve_task', { taskId });
}

export async function cancelTask(taskId: string, reason?: string): Promise<Task> {
  return invoke('codra_cancel_task', { taskId, reason });
}

export async function executeTask(taskId: string): Promise<Task> {
  return invoke('codra_execute_task', { taskId });
}

export async function runVerification(taskId: string): Promise<Task> {
  return invoke('codra_run_verification', { taskId });
}

export async function approveRepair(taskId: string): Promise<Task> {
  return invoke('codra_approve_repair', { taskId });
}
