import { describe, expect, it, vi } from "vitest";
import type { Task } from "./codraTaskApi";
import { runTaskMutationWithRecovery } from "./taskMutationRecovery";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task_1",
    title: "Test",
    userPrompt: "prompt",
    workspacePath: "/workspace",
    status: "awaiting_approval",
    createdAt: "1",
    updatedAt: "1",
    changedFiles: [],
    commandsRun: [],
    ...overrides,
  };
}

describe("runTaskMutationWithRecovery", () => {
  it("refreshes task state from backend after a failed mutation", async () => {
    const refreshed = makeTask({ status: "approved" });
    const getTask = vi.fn().mockResolvedValue(refreshed);
    const onTaskUpdated = vi.fn().mockResolvedValue(undefined);

    const result = await runTaskMutationWithRecovery({
      mutate: vi.fn().mockRejectedValue(new Error("invoke failed")),
      taskId: "task_1",
      workspacePath: "/workspace",
      getTask,
      onTaskUpdated,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("invoke failed");
    }
    expect(getTask).toHaveBeenCalledWith("task_1", "/workspace");
    expect(onTaskUpdated).toHaveBeenCalledWith(refreshed);
  });

  it("returns updated task on successful mutation without refresh", async () => {
    const updated = makeTask({ status: "approved" });
    const getTask = vi.fn();

    const result = await runTaskMutationWithRecovery({
      mutate: vi.fn().mockResolvedValue(updated),
      taskId: "task_1",
      workspacePath: "/workspace",
      getTask,
      onTaskUpdated: vi.fn().mockResolvedValue(undefined),
    });

    expect(result).toEqual({ ok: true, task: updated });
    expect(getTask).not.toHaveBeenCalled();
  });
});