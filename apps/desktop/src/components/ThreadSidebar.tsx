import { useMemo, useState, type ReactNode } from "react";
import {
  FolderOpen,
  FolderTree,
  GitBranch,
  Plus,
  Search,
  Settings,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import type { Task, WorkspaceContext } from "../lib/codraTaskApi";

interface ThreadSidebarProps {
  tasks: Task[];
  selectedTaskId: string | null;
  currentWorkspace: string;
  workspaceContext: WorkspaceContext | null;
  className?: string;
  taskModelLabels?: Record<string, string>;
  onSelectTask: (task: Task) => void;
  onNewThread: () => void;
  onOpenWorkspace: () => void;
}

type SidebarTab = "threads" | "workspace";

export function ThreadSidebar({
  tasks,
  selectedTaskId,
  currentWorkspace,
  workspaceContext,
  className,
  taskModelLabels = {},
  onSelectTask,
  onNewThread,
  onOpenWorkspace,
}: ThreadSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("threads");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return tasks;
    }

    return tasks.filter((task) => {
      const modelLabel = taskModelLabels[task.id] ?? "";
      return [task.title, task.userPrompt, task.workspacePath, task.status, modelLabel]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [search, taskModelLabels, tasks]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();

    for (const task of filteredTasks) {
      const workspace = basename(task.workspacePath) || "Workspace";
      const current = groups.get(workspace) ?? [];
      current.push(task);
      groups.set(workspace, current);
    }

    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  }, [filteredTasks]);

  const workspaceName = basename(currentWorkspace) || "No workspace selected";

  return (
    <aside
      className={[
        "flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[var(--panel-overlay)] shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl",
        className ?? "",
      ].join(" ")}
    >
      <div className="border-b border-[color:var(--border)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Codra
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Open-source agentic coding app for TeraAI.
            </h2>
          </div>
          <button
            type="button"
            onClick={onNewThread}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
            title="New thread"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-1">
          <TabButton active={activeTab === "threads"} onClick={() => setActiveTab("threads")}>
            Threads
          </TabButton>
          <TabButton active={activeTab === "workspace"} onClick={() => setActiveTab("workspace")}>
            Workspace
          </TabButton>
        </div>

        <button
          type="button"
          onClick={onNewThread}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          New thread
        </button>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2.5">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={activeTab === "threads" ? "Search threads" : "Search workspace context"}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {activeTab === "threads" ? (
          groupedTasks.length > 0 ? (
            <div className="space-y-4">
              {groupedTasks.map(([workspace, workspaceTasks]) => (
                <section key={workspace} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    <FolderTree className="h-3.5 w-3.5" />
                    {workspace}
                  </div>

                  <div className="space-y-2">
                    {workspaceTasks.map((task) => {
                      const selected = task.id === selectedTaskId;
                      const modelLabel = taskModelLabels[task.id];
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className={[
                            "w-full rounded-[22px] border px-3 py-3 text-left transition",
                            selected
                              ? "border-[color:var(--accent)] bg-[var(--accent-soft)]"
                              : "border-[color:var(--border)] bg-[var(--panel-muted)] hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {task.title || "Untitled thread"}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                                {task.userPrompt}
                              </div>
                            </div>
                            <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                              {formatStatusLabel(task.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1">
                              <FolderOpen className="h-3.5 w-3.5" />
                              {basename(task.workspacePath) || workspace}
                            </span>
                            {modelLabel ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2 py-0.5">
                                <Sparkles className="h-3 w-3" />
                                {modelLabel}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No threads yet"
              description="Pick a model. Open a project. Prompt. Review. Ship. Your task threads will appear here."
            />
          )
        ) : (
          <div className="space-y-4">
            <section className="rounded-[22px] border border-[color:var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Current project
              </div>
              <div className="mt-2 text-base font-medium text-[var(--text-primary)]">{workspaceName}</div>
              <div className="mt-1 break-all text-sm text-[var(--text-muted)]">
                {currentWorkspace || "Select a workspace to start coding."}
              </div>
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-base)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
              >
                <FolderOpen className="h-4 w-4" />
                Open project
              </button>
            </section>

            <section className="rounded-[22px] border border-[color:var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Repository
              </div>
              <div className="mt-3 space-y-3 text-sm text-[var(--text-primary)]">
                <MetaRow label="Git status" value={workspaceContext?.isGitRepo ? "Repository detected" : "No repo detected"} />
                <MetaRow label="Branch" value={workspaceContext?.gitBranch || "—"} icon={<GitBranch className="h-3.5 w-3.5" />} />
                <MetaRow label="Stack" value={workspaceContext?.detectedStack.join(" · ") || "Unknown"} />
                <MetaRow label="Configs" value={workspaceContext?.detectedConfigFiles.slice(0, 3).join(" · ") || "None detected"} />
              </div>
            </section>

            <section className="rounded-[22px] border border-[color:var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Local flow
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Codra will show a plan before changing files. Use this workspace tab to keep project context visible while you review threads.
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="border-t border-[color:var(--border)] p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-3 text-left text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
        >
          <Settings className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="flex-1">Settings</span>
          <TerminalSquare className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      </div>
    </aside>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-[var(--panel-base)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-10 text-center">
      <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-base)] px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
        {icon}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function basename(path: string) {
  const normalized = path.replace(/[\\/]+$/, "");
  if (!normalized) return "";
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || normalized;
}

function formatStatusLabel(status: string) {
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}
