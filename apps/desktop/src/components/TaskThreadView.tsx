import { useState } from 'react';
import {
  approveTask,
  cancelTask,
  executeTask,
  approveRepair,
} from '../lib/codraTaskApi';
import type { Task, TaskEvent } from '../lib/codraTaskApi';
import { Check, Play, AlertTriangle, Clock } from 'lucide-react';

interface TaskThreadViewProps {
  task: Task | null;
  events: TaskEvent[];
  onTaskUpdated: (task: Task) => void;
  workspacePath: string;
  modelLabel: string;
}

export function TaskThreadView({
  task,
  events,
  onTaskUpdated,
  workspacePath,
  modelLabel,
}: TaskThreadViewProps) {
  const [loading, setLoading] = useState(false);

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/[0.04]" />
          <div className="text-lg font-medium text-white">What should Codra do in this folder?</div>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">
            Select a workspace, pick a model, and describe the task.
          </p>
        </div>
      </div>
    );
  }

  const status = task.status;

  async function handleApprove() {
    if (!task) return;
    setLoading(true);
    try {
      const updated = await approveTask(task.id);
      onTaskUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveRepair() {
    if (!task) return;
    setLoading(true);
    try {
      const updated = await approveRepair(task.id);
      onTaskUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleRun() {
    if (!task) return;
    setLoading(true);
    try {
      const updated = await executeTask(task.id);
      onTaskUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!task) return;
    setLoading(true);
    try {
      const updated = await cancelTask(task.id, 'User cancelled');
      onTaskUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#070b12]">
      {/* Thread Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-6">
        <div>
          <div className="font-semibold tracking-tight">{task.title || 'New thread'}</div>
          <div className="text-xs text-zinc-500">{workspacePath}</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-white/[0.04] px-2.5 py-0.5 text-zinc-400">{modelLabel}</span>
          <span className="rounded bg-white/[0.04] px-2.5 py-0.5 text-emerald-400">{status}</span>
        </div>
      </div>

      {/* Clean Thread Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* User Prompt */}
        <div className="rounded-xl border border-white/[0.05] bg-[#0a0f18] p-5">
          <div className="mb-1 text-xs uppercase tracking-widest text-zinc-500">You</div>
          <div className="text-white">{task.user_prompt}</div>
        </div>

        {/* Workspace Scan */}
        {task.plan && (
          <div className="rounded-xl border border-white/[0.05] bg-[#0a0f18] p-5">
            <div className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Workspace scan</div>
            <div className="text-sm text-zinc-300">Detected stack • {task.workspace_path}</div>
          </div>
        )}

        {/* Plan Card */}
        {task.plan && (
          <div className="rounded-xl border border-white/[0.05] bg-[#0a0f18] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-zinc-500">Plan</div>
              <div className="text-xs text-amber-400">Risk: {task.plan.risk_level}</div>
            </div>
            <div className="font-medium text-white mb-3">{task.plan.summary}</div>
            <div className="space-y-1 text-sm text-zinc-300">
              {task.plan.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-0.5 text-xs text-zinc-500">{idx + 1}.</div>
                  <div>{step.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Button States - Precise per task 8 */}
        {status === 'AwaitingApproval' && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-950/10 p-5">
            <div className="font-medium mb-4">Review the plan above before continuing.</div>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
              >
                <Check className="mr-2 inline h-4 w-4" /> Approve Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 rounded-lg border border-white/[0.15] py-2.5 text-sm hover:bg-white/[0.04]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {status === 'Approved' && (
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0f18] p-5">
            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-500"
            >
              <Play className="mr-2 inline h-4 w-4" /> Run Task
            </button>
            <button onClick={handleCancel} className="mt-2 w-full text-xs text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>
        )}

        {(status === 'Executing' || status === 'Verifying') && (
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0f18] p-5 text-center text-sm text-zinc-400">
            <Clock className="mx-auto mb-2 h-5 w-5 animate-pulse" />
            {status}…
          </div>
        )}

        {status === 'AwaitingRepairApproval' && task.repair_plan && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-5">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <AlertTriangle className="h-4 w-4" /> Repair plan generated
            </div>
            <div className="text-sm mb-4">{task.repair_plan.summary}</div>
            <div className="flex gap-2">
              <button onClick={handleApproveRepair} className="flex-1 rounded-lg bg-rose-600 py-2 text-sm">Approve Repair</button>
              <button onClick={handleCancel} className="flex-1 rounded-lg border border-white/[0.15] py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Command Results */}
        {task.commands_run.length > 0 && (
          <div className="rounded-xl border border-white/[0.05] bg-[#0a0f18] p-5">
            <div className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Commands executed</div>
            {task.commands_run.slice(0, 3).map((cmd, idx) => (
              <div key={idx} className="mb-2 rounded bg-black/40 p-3 text-xs font-mono text-emerald-300">
                $ {cmd.command}
              </div>
            ))}
          </div>
        )}

        {/* Final Report */}
        {task.final_report && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5">
            <div className="mb-1 text-xs uppercase tracking-widest text-emerald-400">Final report</div>
            <div className="whitespace-pre-wrap text-sm text-emerald-200">{task.final_report}</div>
          </div>
        )}

        {/* Error */}
        {task.error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-5 text-sm text-rose-300">
            {task.error}
          </div>
        )}

        {/* Collapsible Timeline */}
        {events.length > 0 && (
          <details className="group text-xs text-zinc-400">
            <summary className="cursor-pointer py-1 hover:text-zinc-300">Timeline ({events.length} events)</summary>
            <div className="mt-2 space-y-1 border-l border-white/[0.08] pl-4 text-[10px]">
              {events.slice(0, 8).map((e, idx) => (
                <div key={idx}>
                  {new Date(e.timestamp).toLocaleTimeString()} — {e.event_type}: {e.message}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Safety Footer */}
      <div className="border-t border-white/[0.06] px-6 py-2 text-center text-[10px] text-zinc-500">
        Verification commands are restricted to Codra’s safe allowlist.
      </div>
    </div>
  );
}
