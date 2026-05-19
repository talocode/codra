import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  GitBranch,
  Play,
  Sparkles,
  TerminalSquare,
  Wand2,
  X,
} from "lucide-react";
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
  providerLabel?: string;
  providerRuntimeStatus?: string;
  onTaskUpdated: (task: Task) => void | Promise<void>;
  onRefreshEvents?: () => void | Promise<void>;
}

export function TaskThreadView({
  task,
  events,
  workspacePath,
  workspaceContext,
  modelLabel,
  providerLabel = "Selected model",
  providerRuntimeStatus = "ready",
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
  const workspaceLabel = workspaceContext?.workspacePath || workspacePath || task.workspacePath;
  const currentWorkspaceName = basename(workspaceLabel);
  const statusLabel = formatStatusLabel(status);
  const canRun = status === "approved";
  const hasRepairPlan = Boolean(task.repairPlan);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-[color:var(--border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Task thread
            </div>
            <h2 className="mt-2 truncate text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {task.title || "Untitled thread"}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <Badge>{statusLabel}</Badge>
              <Badge icon={<Sparkles className="h-3 w-3" />}>{providerLabel}</Badge>
              <Badge>{modelLabel}</Badge>
              <Badge>{providerRuntimeStatus}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
              <span>{currentWorkspaceName}</span>
              <span>•</span>
              <span className="truncate">{task.workspacePath}</span>
              {workspaceContext?.gitBranch ? (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {workspaceContext.gitBranch}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
            {task.id.slice(0, 8)}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="border-b border-[color:var(--danger-border)] bg-[var(--danger-soft)] px-5 py-3 text-sm text-[var(--danger-text)] sm:px-6">
          {actionError}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="space-y-4">
          <StreamCard eyebrow="Prompt" title="What should Codra build?" icon={<Wand2 className="h-4 w-4" />}>
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-primary)]">
              {task.userPrompt}
            </p>
          </StreamCard>

          <StreamCard eyebrow="Workspace" title="Project context" icon={<TerminalSquare className="h-4 w-4" />}>
            {workspaceContext ? (
              <div className="space-y-4 text-sm text-[var(--text-primary)]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoRow label="Workspace" value={workspaceContext.workspacePath} />
                  <InfoRow label="Repository" value={workspaceContext.isGitRepo ? "Git repo" : "Not a git repo"} />
                  <InfoRow label="Branch" value={workspaceContext.gitBranch || "—"} />
                  <InfoRow label="Stack" value={workspaceContext.detectedStack.join(" · ") || "Unknown"} />
                </div>

                {workspaceContext.gitStatusSummary && (
                  <PanelText>{workspaceContext.gitStatusSummary}</PanelText>
                )}

                {workspaceContext.detectedConfigFiles.length > 0 && (
                  <TokenGroup
                    label="Config files"
                    values={workspaceContext.detectedConfigFiles.slice(0, 6)}
                  />
                )}

                {workspaceContext.suggestedCommands.length > 0 && (
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Suggested commands
                    </div>
                    <div className="space-y-2">
                      {workspaceContext.suggestedCommands.slice(0, 3).map((command) => (
                        <div
                          key={command.command}
                          className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate font-mono text-xs text-[var(--text-primary)]">
                              $ {command.command}
                            </div>
                            <Badge>{command.riskLevel}</Badge>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                            {command.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <PanelText>Workspace scan data will appear here after Codra loads project context.</PanelText>
            )}
          </StreamCard>

          <StreamCard eyebrow="Plan" title="Review before change" icon={<Check className="h-4 w-4" />}>
            {task.plan ? (
              <div className="space-y-4 text-sm text-[var(--text-primary)]">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Badge>Risk: {task.plan.riskLevel}</Badge>
                  <Badge>{task.plan.requiresApproval ? "Approval required" : "Auto approve"}</Badge>
                </div>

                <p className="text-[15px] leading-7 text-[var(--text-primary)]">{task.plan.summary}</p>

                <div className="space-y-3">
                  {task.plan.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--panel-base)] text-xs text-[var(--accent)]">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-primary)]">{step.title}</div>
                          <div className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{step.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <InfoRow label="Read" value={task.plan.filesToRead.join(", ") || "—"} />
                  <InfoRow label="Modify" value={task.plan.filesToModify.join(", ") || "—"} />
                  <InfoRow label="Commands" value={task.plan.commandsToRun.join(" · ") || "—"} />
                </div>
              </div>
            ) : (
              <PanelText>Codra is still drafting the plan for this task.</PanelText>
            )}
          </StreamCard>

          {(status === "awaiting_repair_approval" || status === "failed" || hasRepairPlan) && (
            <StreamCard eyebrow="Repair" title="Repair summary" tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className="space-y-4 text-sm text-[var(--text-primary)]">
                <PanelText tone="danger">
                  {task.repairPlan?.summary ||
                    task.error ||
                    "Codra will summarize the repair path here if execution needs follow-up."}
                </PanelText>

                {task.repairPlan?.steps?.length ? (
                  <div className="space-y-2">
                    {task.repairPlan.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--danger-border)] bg-[var(--danger-soft)] text-xs text-[var(--danger-text)]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--text-primary)]">{step.title}</div>
                            <div className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{step.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </StreamCard>
          )}

          <StreamCard eyebrow="Approval" title="Prompt. Review. Approve. Run." icon={<Play className="h-4 w-4" />}>
            {status === "awaiting_approval" && (
              <ActionPanel
                description="Codra will show a plan before changing files. Review it above, then approve to continue."
                primaryAction={{
                  label: "Approve plan",
                  icon: <Check className="h-4 w-4" />,
                  onClick: () => runMutation(() => approveTask(task.id, task.workspacePath)),
                  disabled: loading,
                }}
                secondaryAction={{
                  label: "Cancel",
                  icon: <X className="h-4 w-4" />,
                  onClick: () =>
                    runMutation(() => cancelTask(task.id, task.workspacePath, "User cancelled")),
                  disabled: loading,
                }}
              />
            )}

            {status === "approved" && (
              <ActionPanel
                description="The plan is approved. Run Codra when you are ready."
                primaryAction={{
                  label: "Run task",
                  icon: <Play className="h-4 w-4" />,
                  onClick: () => runMutation(() => executeTask(task.id, task.workspacePath)),
                  disabled: loading || !canRun,
                }}
                secondaryAction={{
                  label: "Cancel",
                  icon: <X className="h-4 w-4" />,
                  onClick: () =>
                    runMutation(() => cancelTask(task.id, task.workspacePath, "User cancelled")),
                  disabled: loading,
                }}
              />
            )}

            {(status === "executing" || status === "verifying" || status === "repairing") && (
              <PanelText>
                <span className="inline-flex items-center gap-2 font-medium text-[var(--text-primary)]">
                  <Clock3 className="h-4 w-4 animate-pulse text-[var(--accent)]" />
                  {statusLabel}
                </span>
                <span className="mt-2 block text-[var(--text-muted)]">
                  Codra is running safe allowlisted commands in the workspace.
                </span>
              </PanelText>
            )}

            {status === "awaiting_repair_approval" && (
              <ActionPanel
                description="Codra generated a repair pass. Review it above, then approve if you want the retry to continue."
                primaryAction={{
                  label: "Approve repair",
                  icon: <Check className="h-4 w-4" />,
                  onClick: () => runMutation(() => approveRepair(task.id, task.workspacePath)),
                  disabled: loading,
                }}
                secondaryAction={{
                  label: "Cancel",
                  icon: <X className="h-4 w-4" />,
                  onClick: () =>
                    runMutation(() => cancelTask(task.id, task.workspacePath, "User cancelled")),
                  disabled: loading,
                }}
              />
            )}

            {status === "completed" && <PanelText>Task complete. Review the final report below for the authoritative result.</PanelText>}
            {status === "failed" && <PanelText tone="danger">Task failed. Review the repair summary and command output before retrying.</PanelText>}
          </StreamCard>

          <StreamCard eyebrow="Execution" title="Command trace" icon={<TerminalSquare className="h-4 w-4" />}>
            <div className="space-y-3 text-sm text-[var(--text-primary)]">
              {task.commandsRun.length > 0 ? (
                task.commandsRun.map((commandRun, index) => (
                  <div
                    key={`${commandRun.command}-${index}`}
                    className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                          Command {index + 1}
                        </div>
                        <div className="mt-2 font-mono text-xs text-[var(--text-primary)]">$ {commandRun.command}</div>
                      </div>
                      <Badge>{commandRun.status}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <InfoRow label="cwd" value={commandRun.cwd} />
                      <InfoRow label="exit" value={commandRun.exitCode?.toString() ?? "—"} />
                      <InfoRow label="status" value={commandRun.status} />
                    </div>

                    {(commandRun.stdoutPreview || commandRun.stderrPreview) && (
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        {commandRun.stdoutPreview ? (
                          <pre className="max-h-44 overflow-auto rounded-2xl border border-[color:var(--border)] bg-[var(--panel-base)] p-3 font-mono text-xs leading-6 text-[var(--text-primary)] whitespace-pre-wrap">
                            {commandRun.stdoutPreview}
                          </pre>
                        ) : null}
                        {commandRun.stderrPreview ? (
                          <pre className="max-h-44 overflow-auto rounded-2xl border border-[color:var(--danger-border)] bg-[var(--danger-soft)] p-3 font-mono text-xs leading-6 text-[var(--danger-text)] whitespace-pre-wrap">
                            {commandRun.stderrPreview}
                          </pre>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <PanelText>Execution output will appear here after the task runs.</PanelText>
              )}
            </div>
          </StreamCard>

          <StreamCard eyebrow="Report" title="Final report" icon={<Sparkles className="h-4 w-4" />}>
            {task.finalReport ? (
              <div className="space-y-4 text-sm leading-7 text-[var(--text-primary)]">
                <pre className="whitespace-pre-wrap rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-4 font-sans text-[15px] leading-7 text-[var(--text-primary)]">
                  {task.finalReport}
                </pre>
                {task.verificationResult ? (
                  <VerificationBlock result={task.verificationResult} />
                ) : null}
              </div>
            ) : task.verificationResult ? (
              <VerificationBlock result={task.verificationResult} />
            ) : (
              <PanelText>The final report will appear here once Codra completes the task.</PanelText>
            )}
          </StreamCard>

          <details className="group rounded-[24px] border border-[color:var(--border)] bg-[var(--panel-card)] p-4 sm:p-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)] outline-none">
              <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                <Clock3 className="h-4 w-4" />
                Timeline ({events.length} events)
              </span>
            </summary>

            <div className="mt-4 space-y-2 border-l border-[color:var(--border)] pl-4 text-xs text-[var(--text-muted)]">
              {events.length > 0 ? (
                events.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-3"
                  >
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      {formatTimestamp(event.timestamp)} · {event.eventType}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                      {event.message}
                    </div>
                  </div>
                ))
              ) : (
                <PanelText>Timeline events will appear once the task starts moving.</PanelText>
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
  icon,
  children,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={[
        "rounded-[24px] border p-4 sm:p-5",
        tone === "danger"
          ? "border-[color:var(--danger-border)] bg-[var(--danger-card)]"
          : "border-[color:var(--border)] bg-[var(--panel-card)]",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">{eyebrow}</div>
          <div className="mt-1 flex items-center gap-2 text-base font-medium tracking-[-0.02em] text-[var(--text-primary)]">
            {icon}
            {title}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionPanel({
  description,
  primaryAction,
  secondaryAction,
}: {
  description: string;
  primaryAction: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean };
  secondaryAction: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean };
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
        <button
          type="button"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {secondaryAction.icon}
          {secondaryAction.label}
        </button>
      </div>
    </div>
  );
}

function VerificationBlock({ result }: { result: NonNullable<Task["verificationResult"]> }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-4 text-sm text-[var(--text-primary)]">
      <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">Verification</div>
      <div className="mt-2 text-[var(--text-primary)]">{result.summary}</div>
      {result.errors.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--danger-text)]">
          {result.errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TokenGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value}>{value}</Badge>
        ))}
      </div>
    </div>
  );
}

function PanelText({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "danger" }) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4 text-sm leading-6",
        tone === "danger"
          ? "border-[color:var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]"
          : "border-[color:var(--border)] bg-[var(--panel-muted)] text-[var(--text-muted)]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Badge({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[var(--panel-muted)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]">
      {icon}
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 truncate text-sm leading-6 text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function basename(path: string) {
  const normalized = path.replace(/[\\/]+$/, "");
  if (!normalized) return "";
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || normalized;
}

function formatStatusLabel(status: Task["status"]) {
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return input;
  }
}
