import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  FolderOpen,
  LayoutGrid,
  MoonStar,
  Plus,
  Send,
  Settings2,
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

function formatStatusLabel(status?: string | null) {
  if (!status) return "Draft";
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
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
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_28%),linear-gradient(180deg,var(--app-bg),var(--app-bg))] p-3">
        <div className="grid h-full grid-cols-1 gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
          <ThreadSidebar
            className="min-h-[14rem] xl:min-h-0"
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            currentWorkspace={workspacePath}
            workspaceContext={workspaceContext}
            taskModelLabels={taskModelLabels}
            onSelectTask={handleSelectTask}
            onNewThread={handleNewThread}
            onOpenWorkspace={handleSelectWorkspace}
          />

          <main className="flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-[color:var(--border)] bg-[var(--panel-overlay)] shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">
                  Pick a model. Open a project. Prompt. Review. Ship.
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl">
                    {selectedTask ? selectedTask.title || "Task thread" : "What should Codra build?"}
                  </h1>
                  <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[var(--panel-muted)] px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
                    {selectedTask ? formatStatusLabel(selectedTask.status) : "Draft thread"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewThread}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                >
                  <Plus className="h-4 w-4" />
                  New thread
                </button>
                <PlaceholderButton icon={<Workflow className="h-4 w-4" />} label="Handoff" />
                <PlaceholderButton icon={<Upload className="h-4 w-4" />} label="Push" />
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                  title="Toggle theme"
                >
                  {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                  {theme === "dark" ? "Light" : "Dark"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-2.5 text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                  title="Layout settings"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] p-2.5 text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                  title="Settings"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </header>

            {!isTauri && (
              <div className="flex items-start gap-2 border-b border-[color:var(--warning-border)] bg-[var(--warning-soft)] px-5 py-3 text-sm text-[var(--warning-text)] sm:px-6">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Tauri runtime unavailable. Native folder selection and task execution only work inside the desktop app window.
                </span>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-hidden">
              {!selectedTask ? (
                <div className="flex h-full min-h-0 overflow-y-auto px-5 py-6 sm:px-6">
                  <div className="mx-auto flex w-full max-w-[880px] flex-col justify-center">
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">
                        Open-source agentic coding app for TeraAI
                      </div>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                        What should Codra build?
                      </h2>
                      <p className="mx-auto mt-3 max-w-[42rem] text-sm leading-6 text-[var(--text-muted)] sm:text-[15px]">
                        Codra will show a plan before changing files.
                      </p>
                    </div>

                    <div className="mt-8 rounded-[30px] border border-[color:var(--border)] bg-[var(--panel-card)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          <ComposerBadge icon={<FolderOpen className="h-3.5 w-3.5" />}>
                            {workspaceLabel}
                          </ComposerBadge>
                          <ComposerBadge>{workspaceContext?.gitBranch ? `local • ${workspaceContext.gitBranch}` : "local workspace"}</ComposerBadge>
                          <ComposerBadge>{selectedModelLabel}</ComposerBadge>
                          <ComposerBadge>{selectedProviderRuntime}</ComposerBadge>
                          {isScanningWorkspace ? <ComposerBadge>Scanning workspace…</ComposerBadge> : null}
                        </div>
                        <button
                          type="button"
                          onClick={handleSelectWorkspace}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                        >
                          <FolderOpen className="h-4 w-4" />
                          Open project
                        </button>
                      </div>

                      <textarea
                        value={prompt}
                        onChange={(event) => {
                          setPrompt(event.target.value);
                          setError(null);
                        }}
                        placeholder="Describe the change, bug, refactor, or feature you want Codra to handle."
                        className="mt-4 min-h-[220px] w-full resize-y rounded-[26px] border border-[color:var(--border)] bg-[var(--panel-base)] px-5 py-4 text-[15px] leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[color:var(--accent)]"
                      />

                      <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3.5 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
                          >
                            <Plus className="h-4 w-4" />
                            Add context
                          </button>
                          <ModelPicker value={modelConfig} onChange={updateModelConfig} />
                        </div>

                        <div className="flex flex-col items-start gap-3 xl:items-end">
                          <p className="text-sm text-[var(--text-muted)]">
                            Pick a model. Open a project. Prompt. Review. Ship.
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateTask}
                            disabled={!canCreateTask}
                            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            {isCreatingTask ? "Creating task…" : "Create task"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {workspaceContext ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <ContextCard label="Detected stack" value={workspaceContext.detectedStack.join(" · ") || "Unknown"} />
                        <ContextCard label="Branch" value={workspaceContext.gitBranch || "—"} />
                        <ContextCard label="Config files" value={workspaceContext.detectedConfigFiles.slice(0, 3).join(" · ") || "None detected"} />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            {error && (
              <div className="border-t border-[color:var(--danger-border)] bg-[var(--danger-soft)] px-5 py-3 text-sm text-[var(--danger-text)] sm:px-6">
                {error}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function PlaceholderButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]"
      title={`${label} placeholder`}
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

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[var(--panel-card)] px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
