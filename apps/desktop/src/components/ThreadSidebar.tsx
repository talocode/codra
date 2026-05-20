import { useMemo, useState } from "react";
import {
  Folder,
  FolderOpen,
  GitBranch,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import type { Task, WorkspaceContext } from "../lib/codraTaskApi";

interface ThreadSidebarProps {
  tasks: Task[];
  selectedTaskId: string | null;
  currentWorkspace: string;
  workspaceContext: WorkspaceContext | null;
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
    <aside className="codra-sidebar">
      <div className="border-b border-[color:var(--border)] px-4 pb-4 pt-5">
        <div className="codra-sidebar-full">
          <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Codra</div>
          <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Codra</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Local-first coding agent workspace</p>
        </div>
        <div className="codra-sidebar-compact-title hidden text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Codra
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-1">
          <TabButton active={activeTab === "threads"} onClick={() => setActiveTab("threads")}>
            Threads
          </TabButton>
          <TabButton active={activeTab === "workspace"} onClick={() => setActiveTab("workspace")}>
            Workspace
          </TabButton>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <SidebarActionButton icon={<Plus className="h-4 w-4" />} label="New thread" onClick={onNewThread} />
          <div className="codra-search-shell">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={activeTab === "threads" ? "Search" : "Search workspace"}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {activeTab === "threads" ? (
          groupedTasks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <span>Threads</span>
                <span className="codra-sidebar-full">{filteredTasks.length}</span>
              </div>

              {groupedTasks.map(([workspace, workspaceTasks]) => (
                <section key={workspace} className="space-y-2">
                  <div className="codra-sidebar-full flex items-center gap-2 px-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    <Folder className="h-3.5 w-3.5" />
                    <span className="truncate">{workspace}</span>
                  </div>

                  <div className="space-y-1.5">
                    {workspaceTasks.map((task) => {
                      const selected = task.id === selectedTaskId;
                      const modelLabel = taskModelLabels[task.id];
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className={[
                            "w-full rounded-[18px] border px-3 py-2.5 text-left transition",
                            selected
                              ? "border-[color:var(--border-strong)] bg-[var(--panel-selected)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                              : "border-transparent bg-transparent hover:border-[color:var(--border)] hover:bg-[var(--panel-muted)]",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {task.title || "Untitled thread"}
                              </div>
                              <div className="codra-sidebar-full mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                                {task.userPrompt}
                              </div>
                            </div>
                            <span className="codra-sidebar-full rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                              {formatStatusLabel(task.status)}
                            </span>
                          </div>

                          <div className="codra-sidebar-full mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
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
            <SidebarEmptyState
              title="No threads yet"
              description="Open a workspace and create the first Codra task thread."
            />
          )
        ) : (
          <div className="space-y-4">
            <section className="rounded-[18px] border border-[color:var(--border)] bg-[var(--panel-muted)] p-3.5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Workspace</div>
              <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">{workspaceName}</div>
              <div className="codra-sidebar-full mt-1 break-all text-xs leading-5 text-[var(--text-muted)]">
                {currentWorkspace || "No workspace selected"}
              </div>
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-base)] px-3 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="codra-sidebar-full">Open project</span>
              </button>
            </section>

            <section className="space-y-2">
              <div className="px-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Project</div>
              <SidebarMetaRow label="Git" value={workspaceContext?.isGitRepo ? "Repository detected" : "No repo detected"} />
              <SidebarMetaRow label="Branch" value={workspaceContext?.gitBranch || "—"} icon={<GitBranch className="h-3.5 w-3.5" />} />
              <SidebarMetaRow label="Stack" value={workspaceContext?.detectedStack.join(" · ") || "Unknown"} />
              <SidebarMetaRow label="Configs" value={workspaceContext?.detectedConfigFiles.slice(0, 3).join(" · ") || "None"} />
            </section>
          </div>
        )}
      </div>

      <div className="border-t border-[color:var(--border)] px-3 py-3">
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 text-left text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
        >
          <Settings className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="codra-sidebar-full flex-1">Settings</span>
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
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-[var(--panel-selected)] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      <span className="codra-sidebar-full">{children}</span>
      <span className="codra-sidebar-compact hidden">{children.slice(0, 1)}</span>
    </button>
  );
}

function SidebarActionButton({
  icon,
  label,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 text-left text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
    >
      {icon}
      <span className="codra-sidebar-full">{label}</span>
    </button>
  );
}

function SidebarEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[color:var(--border)] bg-[var(--panel-muted)] px-4 py-8 text-center">
      <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
      <div className="codra-sidebar-full mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</div>
    </div>
  );
}

function SidebarMetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: JSX.Element;
}) {
  return (
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1.5 flex items-center gap-2 text-sm text-[var(--text-primary)]">
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
