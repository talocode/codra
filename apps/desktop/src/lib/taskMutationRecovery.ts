import type { Task } from "./codraTaskApi";

export type TaskMutationRecoveryDeps = {
  mutate: () => Promise<Task>;
  taskId: string;
  workspacePath: string;
  getTask: (taskId: string, workspacePath: string) => Promise<Task>;
  onTaskUpdated: (task: Task) => void | Promise<void>;
  onRefreshEvents?: () => void | Promise<void>;
};

export type TaskMutationResult =
  | { ok: true; task: Task }
  | { ok: false; error: string };

export async function runTaskMutationWithRecovery(
  deps: TaskMutationRecoveryDeps,
): Promise<TaskMutationResult> {
  try {
    const updated = await deps.mutate();
    await deps.onTaskUpdated(updated);
    await deps.onRefreshEvents?.();
    return { ok: true, task: updated };
  } catch (cause) {
    const error = `Failed to update task: ${String(cause)}`;

    try {
      const refreshed = await deps.getTask(deps.taskId, deps.workspacePath);
      await deps.onTaskUpdated(refreshed);
      await deps.onRefreshEvents?.();
    } catch {
      // Keep the mutation error if refresh also fails.
    }

    return { ok: false, error };
  }
}