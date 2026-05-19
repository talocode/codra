import { useState, useEffect } from "react";
import {
  createTask,
  listTasks,
  scanWorkspace,
  approveTask,
  cancelTask,
  executeTask,
  approveRepair,
} from "../lib/codraTaskApi";
import type { Task } from "../lib/codraTaskApi";

export function TaskLoopView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [workspacePath, setWorkspacePath] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspacePath.trim()) {
      void loadTasks();
    }
  }, [workspacePath]);

  const loadTasks = async () => {
    if (!workspacePath.trim()) {
      setTasks([]);
      return;
    }

    try {
      const result = await listTasks(workspacePath);
      setTasks(result);
    } catch (e: any) {
      setError(e.toString());
    }
  };

  const handleScanWorkspace = async () => {
    if (!workspacePath) return;
    setLoading(true);
    setError(null);
    try {
      await scanWorkspace(workspacePath);
      await loadTasks();
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!workspacePath || !userPrompt) {
      setError("Workspace path and prompt are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newTask = await createTask({
        workspace_path: workspacePath,
        user_prompt: userPrompt,
      });
      setSelectedTask(newTask);
      await loadTasks();
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const selectTask = async (task: Task) => {
    setSelectedTask(task);
  };

  const handleApprove = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      const updated = await approveTask(
        selectedTask.id,
        selectedTask.workspacePath,
      );
      setSelectedTask(updated);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      const updated = await cancelTask(
        selectedTask.id,
        selectedTask.workspacePath,
        "User cancelled",
      );
      setSelectedTask(updated);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      const updated = await executeTask(
        selectedTask.id,
        selectedTask.workspacePath,
      );
      setSelectedTask(updated);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRepair = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      const updated = await approveRepair(
        selectedTask.id,
        selectedTask.workspacePath,
      );
      setSelectedTask(updated);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Task Loop (Legacy View)</h1>
      <p className="text-sm text-zinc-400 mb-6">
        This is the previous dense TaskLoopView. The new primary interface lives
        in App.tsx.
      </p>

      <div className="space-y-4">
        <div>
          <input
            className="w-full rounded border bg-[#111724] p-3 text-sm"
            placeholder="Workspace path"
            value={workspacePath}
            onChange={(e) => setWorkspacePath(e.target.value)}
          />
          <button
            onClick={handleScanWorkspace}
            className="mt-2 rounded bg-white px-4 py-1 text-black text-sm"
          >
            Scan Workspace
          </button>
        </div>

        <textarea
          className="w-full rounded border bg-[#111724] p-3 text-sm min-h-[100px]"
          placeholder="Task prompt..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
        />

        <button
          onClick={handleCreateTask}
          disabled={loading}
          className="rounded bg-violet-600 px-6 py-2 text-sm font-semibold"
        >
          Create Task
        </button>

        {error && <div className="text-rose-400 text-sm">{error}</div>}

        <div className="pt-4">
          <h3 className="font-semibold mb-2">Tasks</h3>
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => selectTask(t)}
              className={`cursor-pointer rounded p-3 mb-1 text-sm ${selectedTask?.id === t.id ? "bg-violet-600/20" : "bg-white/[0.03]"}`}
            >
              {t.title || t.userPrompt.slice(0, 60)} — {t.status}
            </div>
          ))}
        </div>

        {selectedTask && (
          <div className="mt-6 rounded border border-white/[0.1] p-4">
            <div className="font-semibold mb-2">
              Selected: {selectedTask.title}
            </div>
            <div className="flex gap-2">
              {selectedTask.status === "awaiting_approval" && (
                <>
                  <button
                    onClick={handleApprove}
                    className="rounded bg-emerald-600 px-4 py-1 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded border px-4 py-1 text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
              {selectedTask.status === "approved" && (
                <button
                  onClick={handleExecute}
                  className="rounded bg-emerald-600 px-4 py-1 text-sm"
                >
                  Run Task
                </button>
              )}
              {selectedTask.status === "awaiting_repair_approval" && (
                <button
                  onClick={handleApproveRepair}
                  className="rounded bg-rose-600 px-4 py-1 text-sm"
                >
                  Approve Repair
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
