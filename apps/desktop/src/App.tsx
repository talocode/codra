import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  FolderOpen,
  LayoutGrid,
  MoonStar,
  Plus,
  Send,
  Sparkles,
  SunMedium,
  Upload,
  Workflow,
} from "lucide-react";
import {
  createTask,
  getTaskEvents,
  listTasks,
  scanWorkspace,
} from "./lib/codraTaskApi";
import type { Task, TaskEvent, WorkspaceContext } from "./lib/codraTaskApi";
import { ThreadSidebar } from "./components/ThreadSidebar";
import { TaskThreadView } from "./components/TaskThreadView";
import { ModelPicker } from "./components/ModelPicker";
import {
  getModelLabel,
  getProviderRuntimeLabel,
  loadModelConfig,
  saveModelConfig,
  type ModelConfig,
  type Provider,
} from "./lib/modelConfig";
import { selectWorkspaceFolder } from "./lib/workspacePicker";
import { isTauriRuntime } from "./lib/tauriRuntime";
import { applyTheme, loadTheme, saveTheme, type AppTheme } from "./lib/theme";

const LAST_WORKSPACE_KEY = "codra_last_workspace";
const TASK_SELECTIONS_KEY = "codra_task_model_selections";

interface TaskSelectionMeta {
  selectedProvider: Provider;
  selectedModel: string;
  providerRuntimeStatus: string;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => parseTaskTimestamp(b.updatedAt) - parseTaskTimestamp(a.updatedAt));
}

function parseTaskTimestamp(input: string) {
  const unixSeconds = Number(input);
  if (Number.isFinite(unixSeconds) && unixSeconds > 0) {
    return unixSeconds * 1000;
  }

  const parsed = Date.parse(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function upsertTask(tasks: Task[], next: Task) {
  return sortTasks([next, ...tasks.filter((task) => task.id !== next.id)]);
}

function basename(path: string) {
  const normalized = path.replace(/[\\/]+$/, "");
  if (!normalized) return "";
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || normalized;
}

function loadTaskSelections(): Record<string, TaskSelectionMeta> {
  try {
    const raw = localStorage.getItem(TASK_SELECTIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TaskSelectionMeta>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveTaskSelections(next: Record<string, TaskSelectionMeta>) {
  try {
    localStorage.setItem(TASK_SELECTIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore persistence failures in preview contexts
  }
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [workspacePath, setWorkspacePath] = useState("");
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => loadModelConfig());
  const [taskSelections, setTaskSelections] = useState<Record<string, TaskSelectionMeta>>(() => loadTaskSelections());
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isScanningWorkspace, setIsScanningWorkspace] = useState(false);

  const isTauri = isTauriRuntime();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((task) => task.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const selectedTaskSelection = useMemo(() => {
    if (!selectedTaskId) return null;
    return taskSelections[selectedTaskId] ?? null;
  }, [selectedTaskId, taskSelections]);

  const workspaceLabel = basename(workspacePath) || "Open project";
  const selectedModelLabel = getModelLabel(modelConfig.selectedProvider, modelConfig.selectedModel);
  const selectedProviderRuntime = getProviderRuntimeLabel(modelConfig.selectedProvider);
  const taskModelLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(taskSelections).map(([taskId, selection]) => [
          taskId,
          getModelLabel(selection.selectedProvider, selection.selectedModel),
        ]),
      ),
    [taskSelections],
  );

  async function loadTasksForWorkspace(path: string) {
    const nextPath = path.trim();
    if (!nextPath) {
      setTasks([]);
      setSelectedTaskId(null);
      setEvents([]);
      return;
    }

    const nextTasks = sortTasks(await listTasks(nextPath));
    setTasks(nextTasks);
    setSelectedTaskId((current) =>
      current && nextTasks.some((task) => task.id === current) ? current : (nextTasks[0]?.id ?? null),
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const lastWorkspace = localStorage.getItem(LAST_WORKSPACE_KEY);

      if (lastWorkspace && !cancelled) {
        setWorkspacePath(lastWorkspace);
      }

      try {
        const list = lastWorkspace ? await listTasks(lastWorkspace) : [];
        if (!cancelled) {
          setTasks(sortTasks(list));
        }
      } catch (cause) {
        console.error("[Codra] Failed to load tasks:", cause);
      }

      if (lastWorkspace && !cancelled && isTauri) {
        void scanWorkspaceAtPath(lastWorkspace);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTaskId) {
      setEvents([]);
      return;
    }

    const taskId = selectedTaskId;
    let cancelled = false;

    async function loadEvents() {
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        if (!cancelled) {
          setEvents([]);
        }
        return;
      }

      try {
        const next = await getTaskEvents(taskId, currentTask.workspacePath);
        if (!cancelled) {
          setEvents(next);
        }
      } catch (cause) {
        console.error("[Codra] Failed to load task events:", cause);
        if (!cancelled) {
          setEvents([]);
        }
      }
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, [selectedTaskId, tasks]);

  async function scanWorkspaceAtPath(path: string) {
    const nextPath = path.trim();
    if (!nextPath) {
      setWorkspaceContext(null);
      return;
    }

    setIsScanningWorkspace(true);
    try {
      await loadTasksForWorkspace(nextPath);
      const ctx = await scanWorkspace(nextPath);
      setWorkspaceContext(ctx);
      setError(null);
    } catch (cause) {
      setWorkspaceContext(null);
      setError(`Failed to scan workspace: ${String(cause)}`);
    } finally {
      setIsScanningWorkspace(false);
    }
  }

  function persistTaskSelection(taskId: string, selection: TaskSelectionMeta) {
    setTaskSelections((current) => {
      const next = { ...current, [taskId]: selection };
      saveTaskSelections(next);
      return next;
    });
  }

  function handleNewThread() {
    setSelectedTaskId(null);
    setEvents([]);
    setPrompt("");
    setError(null);
  }

  function handleSelectTask(task: Task) {
    if (task.workspacePath !== workspacePath) {
      setWorkspacePath(task.workspacePath);
      localStorage.setItem(LAST_WORKSPACE_KEY, task.workspacePath);
      if (isTauri) {
        void scanWorkspaceAtPath(task.workspacePath);
      }
    }

    setSelectedTaskId(task.id);
    setError(null);
  }

  async function handleSelectWorkspace() {
    if (!isTauri) {
      setError("Open Codra in the desktop app window to use the native folder picker.");
      return;
    }

    try {
      const folder = await selectWorkspaceFolder();
      if (!folder) return;

      setWorkspacePath(folder);
      localStorage.setItem(LAST_WORKSPACE_KEY, folder);
      await scanWorkspaceAtPath(folder);
    } catch (cause) {
      setError(`Failed to select workspace: ${String(cause)}`);
    }
  }

  async function handleCreateTask() {
    const trimmedWorkspace = workspacePath.trim();
    const trimmedPrompt = prompt.trim();

    if (!trimmedWorkspace) {
      setError("Workspace path is required.");
      return;
    }

    if (!trimmedPrompt) {
      setError("Prompt is required.");
      return;
    }

    if (!isTauri) {
      setError("Tauri runtime unavailable. Open Codra in the desktop app window.");
      return;
    }

    setIsCreatingTask(true);
    setError(null);

    try {
      const created = await createTask({
        workspace_path: trimmedWorkspace,
        user_prompt: trimmedPrompt,
        title: trimmedPrompt.slice(0, 72),
      });

      setTasks((current) => upsertTask(current, created));
      setSelectedTaskId(created.id);
      persistTaskSelection(created.id, {
        selectedProvider: modelConfig.selectedProvider,
        selectedModel: modelConfig.selectedModel,
        providerRuntimeStatus: getProviderRuntimeLabel(modelConfig.selectedProvider),
      });
      setPrompt("");

      try {
        const nextEvents = await getTaskEvents(created.id, created.workspacePath);
        setEvents(nextEvents);
      } catch {
        setEvents([]);
      }
    } catch (cause) {
      setError(`Failed to create task: ${String(cause)}`);
    } finally {
      setIsCreatingTask(false);
    }
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((current) => upsertTask(current, updated));
    setError(null);
  }

  async function refreshEvents() {
    if (!selectedTaskId || !selectedTask) {
      setEvents([]);
      return;
    }

    try {
      const next = await getTaskEvents(selectedTaskId, selectedTask.workspacePath);
      setEvents(next);
    } catch {
      setEvents([]);
    }
  }

  const canCreateTask = Boolean(isTauri && workspacePath.trim() && prompt.trim() && !isCreatingTask);

  function handleThemeToggle() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  }

  function updateModelConfig(next: ModelConfig) {
    const persisted = saveModelConfig(next);
    setModelConfig(persisted);
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)] selection:bg-[var(--accent-soft)] selection:text-[var(--text-primary)]">
      <div className="codra-shell">
        <ThreadSidebar
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          currentWorkspace={workspacePath}
          workspaceContext={workspaceContext}
          taskModelLabels={taskModelLabels}
          onSelectTask={handleSelectTask}
          onNewThread={handleNewThread}
          onOpenWorkspace={handleSelectWorkspace}
        />

        <main className="codra-main">
          <header className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                {selectedTask ? "Task thread" : "New thread"}
              </div>
              <h1 className="mt-1 truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-base">
                {selectedTask ? selectedTask.title || "Untitled thread" : "What should Codra build?"}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <HeaderButton icon={<Plus className="h-4 w-4" />} label="New thread" onClick={handleNewThread} />
              <HeaderButton icon={<Workflow className="h-4 w-4" />} label="Handoff" />
              <HeaderIconButton icon={<LayoutGrid className="h-4 w-4" />} title="Tools and layout placeholder" />
              <HeaderButton icon={<Upload className="h-4 w-4" />} label="Push" />
              <HeaderIconButton
                icon={theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                onClick={handleThemeToggle}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              />
            </div>
          </header>

          {!isTauri ? (
            <div className="mx-5 mt-3 flex items-center gap-2 rounded-2xl border border-[color:var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning-text)] sm:mx-6">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Tauri runtime unavailable. Open Codra in the desktop app window for native workspace picking and task execution.</span>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            {selectedTask ? (
              <TaskThreadView
                task={selectedTask}
                events={events}
                workspacePath={workspacePath}
                workspaceContext={workspaceContext}
                modelLabel={selectedTaskSelection ? getModelLabel(selectedTaskSelection.selectedProvider, selectedTaskSelection.selectedModel) : selectedModelLabel}
                providerLabel={selectedTaskSelection?.selectedProvider ?? modelConfig.selectedProvider}
                providerRuntimeStatus={selectedTaskSelection?.providerRuntimeStatus ?? selectedProviderRuntime}
                onTaskUpdated={handleTaskUpdated}
                onRefreshEvents={refreshEvents}
              />
            ) : (
              <div className="flex h-full min-h-0 overflow-y-auto px-5 py-6 sm:px-6">
                <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col items-center justify-center">
                  <div className="w-full max-w-[720px] text-center">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-[var(--panel-muted)] text-[var(--accent)] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="mt-5 text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                      Desktop coding agent
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-[2.6rem]">
                      What should Codra build?
                    </h2>
                    <p className="mx-auto mt-3 max-w-[36rem] text-sm leading-6 text-[var(--text-muted)] sm:text-[15px]">
                      Open a project, pick a model, and describe the change. Codra will plan before it edits anything.
                    </p>
                  </div>

                  <section className="mt-8 w-full max-w-[720px] rounded-[28px] border border-[color:var(--border)] bg-[var(--panel-card)] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.30)] sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <ComposerBadge icon={<FolderOpen className="h-3.5 w-3.5" />}>{workspaceLabel}</ComposerBadge>
                      <ComposerBadge>{workspaceContext?.gitBranch ? `local • ${workspaceContext.gitBranch}` : "local workspace"}</ComposerBadge>
                      {isScanningWorkspace ? <ComposerBadge>Scanning workspace…</ComposerBadge> : null}
                    </div>

                    <textarea
                      value={prompt}
                      onChange={(event) => {
                        setPrompt(event.target.value);
                        setError(null);
                      }}
                      placeholder="Describe the bug, feature, refactor, or workflow you want Codra to handle."
                      className="mt-4 min-h-[190px] w-full resize-none rounded-[24px] border border-[color:var(--border)] bg-[var(--panel-base)] px-4 py-4 text-[15px] leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[color:var(--accent)]"
                    />

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <ComposerActionButton icon={<Plus className="h-4 w-4" />} label="Context" />
                        <ModelPicker value={modelConfig} onChange={updateModelConfig} />
                        <ComposerBadge>{selectedModelLabel}</ComposerBadge>
                        <ComposerBadge>{selectedProviderRuntime}</ComposerBadge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleSelectWorkspace}
                          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3.5 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                        >
                          <FolderOpen className="h-4 w-4" />
                          Open project
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateTask}
                          disabled={!canCreateTask}
                          className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {isCreatingTask ? "Creating…" : "Create task"}
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>

          {error ? (
            <div className="border-t border-[color:var(--danger-border)] bg-[var(--danger-soft)] px-5 py-3 text-sm text-[var(--danger-text)] sm:px-6">
              {error}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function HeaderButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function HeaderIconButton({
  icon,
  onClick,
  title,
}: {
  icon: ReactNode;
  onClick?: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
    >
      {icon}
    </button>
  );
}

function ComposerActionButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3.5 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
    >
      {icon}
      {label}
    </button>
  );
}

function ComposerBadge({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[var(--panel-muted)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
      {icon}
      {children}
    </span>
  );
}
