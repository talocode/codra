import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, Clock, Terminal, Play } from "lucide-react";
import {
  approveRepair,
  approveTask,
  cancelTask,
  executeTask,
} from "../lib/codraTaskApi";
import type { Task, TaskEvent, WorkspaceContext } from "../lib/codraTaskApi";

interface TaskThreadViewProps {
  task: Task | null;
  events: TaskEvent[];
  workspacePath: string;
  workspaceContext: WorkspaceContext | null;
  modelLabel: string;
  onTaskUpdated: (task: Task) => void | Promise<void>;
  onRefreshEvents?: () => void | Promise<void>;
}

export function TaskThreadView({
  task,
  events,
  workspacePath,
  workspaceContext,
  modelLabel,
  onTaskUpdated,
  onRefreshEvents,
}: TaskThreadViewProps) {
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!task) {
    return null;
  }

  async function runMutation(nextTask: () => Promise<Task>) {
    setLoading(true);
    setActionError(null);
    try {
      const updated = await nextTask();
      await onTaskUpdated(updated);
      await onRefreshEvents?.();
    } catch (cause) {
      setActionError(`Failed to update task: ${String(cause)}`);
    } finally {
      setLoading(false);
    }
  }

  const status = task.status;
  const workspaceLabel =
    workspaceContext?.workspace_path || workspacePath || task.workspace_path;
  const currentWorkspaceName = basename(workspaceLabel);
  const statusLabel = formatStatusLabel(status);
  const canRun = status === "approved";
  const hasRepairPlan = Boolean(task.repair_plan);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
              Task thread
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="truncate text-lg font-semibold tracking-tight text-white">
                {task.title || "Untitled thread"}
              </h2>
              <span className="inline-flex items-center rounded-full border border-[rgba(155,192,255,0.16)] bg-[rgba(77,137,255,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#9bc0ff]">
                {statusLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-[#96a0b4]">
                {modelLabel}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#96a0b4]">
              <span>{currentWorkspaceName}</span>
              <span>·</span>
              <span className="truncate">{task.workspace_path}</span>
            </div>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-[#96a0b4]">
            {task.id.slice(0, 8)}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="border-b border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300 sm:px-6">
          {actionError}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="space-y-4 sm:space-y-5">
          <StreamCard eyebrow="You" title="Prompt" tone="default">
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-white">
              {task.user_prompt}
            </p>
          </StreamCard>

          <StreamCard
            eyebrow="Workspace scan"
            title="Repository context"
            tone="blue"
          >
            {workspaceContext ? (
              <div className="space-y-4 text-sm text-[#d7deea]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="Workspace"
                    value={workspaceContext.workspace_path}
                  />
                  <InfoRow
                    label="Repository"
                    value={
                      workspaceContext.is_git_repo
                        ? "Git repo"
                        : "Not a git repo"
                    }
                  />
                  <InfoRow
                    label="Branch"
                    value={workspaceContext.git_branch || "—"}
                  />
                  <InfoRow
                    label="Stack"
                    value={
                      workspaceContext.detected_stack.join(" · ") || "Unknown"
                    }
                  />
                </div>

                {workspaceContext.git_status_summary && (
                  <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3 text-sm text-[#96a0b4]">
                    {workspaceContext.git_status_summary}
                  </div>
                )}

                {workspaceContext.detected_config_files.length > 0 && (
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
                      Config files
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workspaceContext.detected_config_files
                        .slice(0, 6)
                        .map((file) => (
                          <span
                            key={file}
                            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#96a0b4]"
                          >
                            {file}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {workspaceContext.suggested_commands.length > 0 && (
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
                      Suggested commands
                    </div>
                    <div className="space-y-2">
                      {workspaceContext.suggested_commands
                        .slice(0, 3)
                        .map((command) => (
                          <div
                            key={command.command}
                            className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="truncate font-mono text-xs text-white">
                                $ {command.command}
                              </div>
                              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[#96a0b4]">
                                {command.risk_level}
                              </span>
                            </div>
                            <div className="mt-2 text-sm leading-6 text-[#96a0b4]">
                              {command.reason}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-6 text-[#96a0b4]">
                Workspace scan will appear here after Codra selects or scans a
                folder.
              </div>
            )}
          </StreamCard>

          <StreamCard eyebrow="Memory" title="Relevant memory" tone="amber">
            <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-6 text-[#96a0b4]">
              <div className="text-sm font-medium text-white">
                Memory layer coming next.
              </div>
              <p className="mt-2">
                This card is reserved for remembered project facts, approval
                habits, and task-specific reminders.
              </p>
            </div>
          </StreamCard>

          <StreamCard eyebrow="Plan" title="Execution plan" tone="default">
            {task.plan ? (
              <div className="space-y-4 text-sm text-[#d7deea]">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#96a0b4]">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                    Risk: {task.plan.risk_level}
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                    {task.plan.requires_approval
                      ? "Approval required"
                      : "Auto-approve"}
                  </span>
                </div>

                <p className="text-[15px] leading-7 text-white">
                  {task.plan.summary}
                </p>

                <div className="space-y-3">
                  {task.plan.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-[#9bc0ff]">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white">
                            {step.title}
                          </div>
                          <div className="mt-1 text-sm leading-6 text-[#96a0b4]">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoRow
                    label="Read"
                    value={task.plan.files_to_read.join(", ") || "—"}
                  />
                  <InfoRow
                    label="Modify"
                    value={task.plan.files_to_modify.join(", ") || "—"}
                  />
                  <InfoRow
                    label="Commands"
                    value={task.plan.commands_to_run.join(" · ") || "—"}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-6 text-[#96a0b4]">
                Plan generation is still in progress.
              </div>
            )}
          </StreamCard>

          {(status === "awaiting_repair_approval" ||
            status === "failed" ||
            hasRepairPlan) && (
            <StreamCard eyebrow="Repair" title="Repair summary" tone="rose">
              <div className="space-y-4 text-sm text-[#d7deea]">
                <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4">
                  <div className="flex items-center gap-2 text-[#f07d97]">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">
                      Repair / failure context
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap leading-7 text-white">
                    {task.repair_plan?.summary ||
                      task.error ||
                      "Codra will summarize the repair path here if the execution pass needs follow-up."}
                  </p>
                </div>

                {task.repair_plan?.steps?.length ? (
                  <div className="space-y-2">
                    {task.repair_plan.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(240,125,151,0.16)] bg-[rgba(240,125,151,0.08)] text-xs text-[#f07d97]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white">
                              {step.title}
                            </div>
                            <div className="mt-1 text-sm leading-6 text-[#96a0b4]">
                              {step.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </StreamCard>
          )}

          <StreamCard
            eyebrow="Approval"
            title="Safety gate"
            tone={approvalTone(status)}
          >
            {status === "awaiting_approval" && (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[#d7deea]">
                  Review the plan above before Codra can modify files.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() =>
                      runMutation(() =>
                        approveTask(task.id, task.workspace_path),
                      )
                    }
                    disabled={loading}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,rgba(77,137,255,1),rgba(50,102,222,1))] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,137,255,0.22),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Approve plan
                  </button>
                  <button
                    onClick={() =>
                      runMutation(() =>
                        cancelTask(
                          task.id,
                          task.workspace_path,
                          "User cancelled",
                        ),
                      )
                    }
                    disabled={loading}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-4 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {status === "approved" && (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[#d7deea]">
                  The plan is approved. Run Codra when you are ready.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() =>
                      runMutation(() =>
                        executeTask(task.id, task.workspace_path),
                      )
                    }
                    disabled={loading || !canRun}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,rgba(77,137,255,1),rgba(50,102,222,1))] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,137,255,0.22),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="h-4 w-4" />
                    Run task
                  </button>
                  <button
                    onClick={() =>
                      runMutation(() =>
                        cancelTask(
                          task.id,
                          task.workspace_path,
                          "User cancelled",
                        ),
                      )
                    }
                    disabled={loading}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-4 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {(status === "executing" ||
              status === "verifying" ||
              status === "repairing") && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm text-[#96a0b4]">
                <Clock className="h-4 w-4 animate-pulse text-[#9bc0ff]" />
                <div>
                  <div className="font-medium text-white">{statusLabel}</div>
                  <div className="mt-1 leading-6 text-[#96a0b4]">
                    Codra is running safe allowlisted commands in the workspace.
                  </div>
                </div>
              </div>
            )}

            {status === "awaiting_repair_approval" && (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[#d7deea]">
                  Codra generated a repair pass. Approve it to continue.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() =>
                      runMutation(() =>
                        approveRepair(task.id, task.workspace_path),
                      )
                    }
                    disabled={loading}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,rgba(77,137,255,1),rgba(50,102,222,1))] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,137,255,0.22),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Approve repair
                  </button>
                  <button
                    onClick={() =>
                      runMutation(() =>
                        cancelTask(
                          task.id,
                          task.workspace_path,
                          "User cancelled",
                        ),
                      )
                    }
                    disabled={loading}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-4 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {status === "completed" && (
              <div className="rounded-2xl border border-[rgba(77,137,255,0.16)] bg-[rgba(77,137,255,0.08)] px-4 py-4 text-sm leading-6 text-[#d7deea]">
                Task complete. Review the final report below for the
                authoritative result.
              </div>
            )}

            {status === "failed" && (
              <div className="rounded-2xl border border-[rgba(240,125,151,0.18)] bg-[rgba(240,125,151,0.08)] px-4 py-4 text-sm leading-6 text-[#f6c0cc]">
                Task failed. Review the repair summary and command output above
                before retrying.
              </div>
            )}
          </StreamCard>

          <StreamCard eyebrow="Execution" title="Command trace" tone="default">
            <div className="space-y-3 text-sm text-[#d7deea]">
              {task.commands_run.length > 0 ? (
                task.commands_run.map((commandRun, index) => (
                  <div
                    key={`${commandRun.command}-${index}`}
                    className="rounded-2xl border border-white/[0.06] bg-black/25 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[#6f7889]">
                          <Terminal className="h-3.5 w-3.5 text-[#9bc0ff]" />
                          Command {index + 1}
                        </div>
                        <div className="mt-2 font-mono text-xs text-white">
                          $ {commandRun.command}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-[#96a0b4]">
                        {commandRun.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-[#96a0b4] sm:grid-cols-3">
                      <InfoRow label="cwd" value={commandRun.cwd} />
                      <InfoRow
                        label="exit"
                        value={commandRun.exit_code?.toString() ?? "—"}
                      />
                      <InfoRow label="status" value={commandRun.status} />
                    </div>

                    {(commandRun.stdout_preview ||
                      commandRun.stderr_preview) && (
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        {commandRun.stdout_preview && (
                          <pre className="max-h-40 overflow-auto rounded-2xl border border-white/[0.06] bg-[#070b12] p-3 font-mono text-xs leading-6 text-[#d7deea] whitespace-pre-wrap">
                            {commandRun.stdout_preview}
                          </pre>
                        )}
                        {commandRun.stderr_preview && (
                          <pre className="max-h-40 overflow-auto rounded-2xl border border-[rgba(240,125,151,0.18)] bg-[rgba(240,125,151,0.08)] p-3 font-mono text-xs leading-6 text-[#f6c0cc] whitespace-pre-wrap">
                            {commandRun.stderr_preview}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-6 text-[#96a0b4]">
                  Execution output will appear here after the task runs.
                </div>
              )}
            </div>
          </StreamCard>

          <StreamCard eyebrow="Report" title="Final report" tone="emerald">
            {task.final_report ? (
              <div className="space-y-4 text-sm leading-7 text-[#d7deea]">
                <pre className="whitespace-pre-wrap rounded-2xl border border-white/[0.06] bg-black/25 p-4 font-sans text-[15px] leading-7 text-white">
                  {task.final_report}
                </pre>
                {task.verification_result && (
                  <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4 text-sm text-[#96a0b4]">
                    <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
                      Verification
                    </div>
                    <div className="mt-2 text-white">
                      {task.verification_result.summary}
                    </div>
                    {task.verification_result.errors.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-[#f6c0cc]">
                        {task.verification_result.errors.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : task.verification_result ? (
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-7 text-[#d7deea]">
                <div className="font-medium text-white">
                  {task.verification_result.summary}
                </div>
                {task.verification_result.errors.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-[#f6c0cc]">
                    {task.verification_result.errors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-6 text-[#96a0b4]">
                The final report will appear here once Codra completes the task.
              </div>
            )}
          </StreamCard>

          <details className="group rounded-[22px] border border-white/[0.06] bg-[#0a0f18] p-4 sm:p-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-white outline-none">
              <span className="inline-flex items-center gap-2 text-[#9bc0ff]">
                <Clock className="h-4 w-4" />
                Timeline ({events.length} events)
              </span>
            </summary>

            <div className="mt-4 space-y-2 border-l border-white/[0.08] pl-4 text-xs text-[#96a0b4]">
              {events.length > 0 ? (
                events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3"
                  >
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[#6f7889]">
                      {formatTimestamp(event.timestamp)} · {event.event_type}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#d7deea]">
                      {event.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-4 text-sm leading-6 text-[#96a0b4]">
                  Timeline events will appear once the task starts moving.
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function StreamCard({
  eyebrow,
  title,
  tone,
  children,
}: {
  eyebrow: string;
  title: string;
  tone: "default" | "blue" | "amber" | "rose" | "emerald";
  children: ReactNode;
}) {
  const styles = toneStyles[tone];

  return (
    <section
      className={[
        "rounded-[22px] border p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        styles.wrapper,
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div
            className={[
              "text-[10px] uppercase tracking-[0.34em]",
              styles.eyebrow,
            ].join(" ")}
          >
            {eyebrow}
          </div>
          <div className="mt-1 text-base font-medium tracking-[-0.02em] text-white">
            {title}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.28em] text-[#6f7889]">
        {label}
      </div>
      <div className="mt-2 truncate text-sm leading-6 text-white">{value}</div>
    </div>
  );
}

function approvalTone(
  status: Task["status"],
): "default" | "blue" | "amber" | "rose" | "emerald" {
  switch (status) {
    case "awaiting_approval":
    case "approved":
      return "blue";
    case "awaiting_repair_approval":
    case "failed":
      return "rose";
    case "executing":
    case "verifying":
    case "repairing":
    case "repair_planning":
      return "amber";
    case "completed":
      return "emerald";
    default:
      return "default";
  }
}

function formatStatusLabel(status: Task["status"]) {
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function basename(path: string) {
  const normalized = path.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || normalized || "Workspace";
}

function parseTaskTimestamp(input: string) {
  const unixSeconds = Number(input);
  if (Number.isFinite(unixSeconds) && unixSeconds > 0) {
    return unixSeconds * 1000;
  }

  const parsed = Date.parse(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTimestamp(input: string) {
  try {
    return new Date(parseTaskTimestamp(input)).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return input;
  }
}

const toneStyles = {
  default: {
    wrapper: "border-white/[0.06] bg-[#0a0f18]",
    eyebrow: "text-[#6f7889]",
  },
  blue: {
    wrapper: "border-[rgba(155,192,255,0.16)] bg-[rgba(77,137,255,0.08)]",
    eyebrow: "text-[#9bc0ff]",
  },
  amber: {
    wrapper: "border-[rgba(240,179,95,0.16)] bg-[rgba(240,179,95,0.08)]",
    eyebrow: "text-[#f0b35f]",
  },
  rose: {
    wrapper: "border-[rgba(240,125,151,0.18)] bg-[rgba(240,125,151,0.08)]",
    eyebrow: "text-[#f07d97]",
  },
  emerald: {
    wrapper: "border-[rgba(77,137,255,0.16)] bg-[rgba(77,137,255,0.08)]",
    eyebrow: "text-[#9bc0ff]",
  },
} as const;
