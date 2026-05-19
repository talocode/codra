import { invoke } from "@tauri-apps/api/core";
import type { Task, TaskEvent, WorkspaceContext } from "@codra/shared";

export type { Task, TaskEvent, WorkspaceContext } from "@codra/shared";

function requireWorkspacePath(workspacePath: string): string {
  const trimmedPath = workspacePath.trim();
  if (!trimmedPath) {
    throw new Error("workspace_path is required");
  }

  return trimmedPath;
}

export async function createTask(input: {
  workspace_path: string;
  user_prompt: string;
  title?: string;
}): Promise<Task> {
  return invoke("codra_create_task", {
    ...input,
    workspace_path: requireWorkspacePath(input.workspace_path),
  });
}

export async function listTasks(workspacePath: string): Promise<Task[]> {
  return invoke("codra_list_tasks", {
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function getTask(
  taskId: string,
  workspacePath: string,
): Promise<Task> {
  return invoke("codra_get_task", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function getTaskEvents(
  taskId: string,
  workspacePath: string,
): Promise<TaskEvent[]> {
  return invoke("codra_get_task_events", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function scanWorkspace(
  workspacePath: string,
): Promise<WorkspaceContext> {
  return invoke("codra_scan_workspace", {
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function approveTask(
  taskId: string,
  workspacePath: string,
): Promise<Task> {
  return invoke("codra_approve_task", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function cancelTask(
  taskId: string,
  workspacePath: string,
  reason?: string,
): Promise<Task> {
  return invoke("codra_cancel_task", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
    reason,
  });
}

export async function executeTask(
  taskId: string,
  workspacePath: string,
): Promise<Task> {
  return invoke("codra_execute_task", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function runVerification(
  taskId: string,
  workspacePath: string,
): Promise<Task> {
  return invoke("codra_run_verification", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
  });
}

export async function approveRepair(
  taskId: string,
  workspacePath: string,
): Promise<Task> {
  return invoke("codra_approve_repair", {
    taskId,
    workspacePath: requireWorkspacePath(workspacePath),
  });
}
