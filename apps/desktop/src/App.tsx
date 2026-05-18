import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FolderOpen, Play } from 'lucide-react';
import { createTask, getTaskEvents, listTasks, scanWorkspace } from './lib/codraTaskApi';
import type { Task, TaskEvent, WorkspaceContext } from './lib/codraTaskApi';
import { ThreadSidebar } from './components/ThreadSidebar';
import { TaskThreadView } from './components/TaskThreadView';
import { ModelPicker } from './components/ModelPicker';
import { getModelLabel, loadModelConfig, type ModelConfig } from './lib/modelConfig';
import { selectWorkspaceFolder } from './lib/workspacePicker';
import { isTauriRuntime } from './lib/tauriRuntime';

const LAST_WORKSPACE_KEY = 'codra_last_workspace';

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const aTime = new Date(a.updated_at).getTime();
    const bTime = new Date(b.updated_at).getTime();
    return bTime - aTime;
  });
}

function upsertTask(tasks: Task[], next: Task) {
  return sortTasks([next, ...tasks.filter((task) => task.id !== next.id)]);
}

function basename(path: string) {
  const normalized = path.replace(/[\\/]+$/, '');
  if (!normalized) return '';
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || normalized;
}

function formatStatusLabel(status?: string | null) {
  if (!status) return 'Local-first mode';
  return status
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [workspacePath, setWorkspacePath] = useState('');
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => loadModelConfig());
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isScanningWorkspace, setIsScanningWorkspace] = useState(false);

  const isTauri = isTauriRuntime();

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((task) => task.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const workspaceLabel = basename(workspacePath) || 'Select workspace';
  const modelLabel = getModelLabel(modelConfig.selectedProvider, modelConfig.selectedModel);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const list = await listTasks();
        if (!cancelled) {
          setTasks(sortTasks(list));
        }
      } catch (cause) {
        console.error('[Codra] Failed to load tasks:', cause);
      }

      const lastWorkspace = localStorage.getItem(LAST_WORKSPACE_KEY);
      if (lastWorkspace && !cancelled) {
        setWorkspacePath(lastWorkspace);
        if (isTauri) {
          void scanWorkspaceAtPath(lastWorkspace);
        }
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
      try {
        const next = await getTaskEvents(taskId);
        if (!cancelled) {
          setEvents(next);
        }
      } catch (cause) {
        console.error('[Codra] Failed to load task events:', cause);
        if (!cancelled) {
          setEvents([]);
        }
      }
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, [selectedTaskId]);

  async function scanWorkspaceAtPath(path: string) {
    const nextPath = path.trim();
    if (!nextPath) {
      setWorkspaceContext(null);
      return;
    }

    setIsScanningWorkspace(true);
    try {
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

  function handleNewThread() {
    setSelectedTaskId(null);
    setEvents([]);
    setPrompt('');
    setError(null);
  }

  function handleSelectTask(task: Task) {
    setSelectedTaskId(task.id);
    setError(null);
  }

  async function handleSelectWorkspace() {
    if (!isTauri) {
      setError('Open Codra in the desktop app window to use the native folder picker.');
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
      setError('Workspace path is required.');
      return;
    }

    if (!trimmedPrompt) {
      setError('Prompt is required.');
      return;
    }

    if (!isTauri) {
      setError('Tauri runtime unavailable. Open Codra in the desktop app window.');
      return;
    }

    setIsCreatingTask(true);
    setError(null);

    try {
      const created = await createTask({
        workspace_path: trimmedWorkspace,
        user_prompt: trimmedPrompt,
        title: trimmedPrompt.slice(0, 60),
      });

      setTasks((current) => upsertTask(current, created));
      setSelectedTaskId(created.id);
      setPrompt('');

      try {
        const nextEvents = await getTaskEvents(created.id);
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
    if (!selectedTaskId) {
      setEvents([]);
      return;
    }

    try {
      const next = await getTaskEvents(selectedTaskId);
      setEvents(next);
    } catch {
      setEvents([]);
    }
  }

  const canCreateTask = Boolean(isTauri && workspacePath.trim() && prompt.trim() && !isCreatingTask);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#04060a] text-[#f4f7fb] selection:bg-white/15 selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(77,137,255,0.14),transparent_22%),radial-gradient(circle_at_86%_20%,rgba(77,137,255,0.08),transparent_20%),radial-gradient(circle_at_50%_120%,rgba(8,13,24,0.95),rgba(4,6,10,1)_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:78px_78px] opacity-35 [mask-image:radial-gradient(circle_at_center,rgba(0,0,0,0.92),rgba(0,0,0,0.25)_80%,transparent_100%)]" />
      <div className="relative grid h-full w-full grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(260px,38vh)] gap-3 p-2 sm:p-3 lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
        <ThreadSidebar
          className="order-2 min-h-0 lg:order-1"
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={handleSelectTask}
          onNewThread={handleNewThread}
          onOpenWorkspace={handleSelectWorkspace}
          currentWorkspace={workspacePath}
          workspaceContext={workspaceContext}
        />

        <main className="order-1 flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,15,24,0.96),rgba(7,10,16,0.92))] shadow-[0_24px_80px_rgba(0,0,0,0.52)] backdrop-blur-[18px] lg:order-2">
          <header className="flex h-16 items-center justify-between gap-4 border-b border-white/[0.06] px-4 sm:px-6">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">Codra interface artifact</div>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                  {selectedTask ? selectedTask.title || 'Task thread' : 'What should Codra do in this workspace?'}
                </h1>
                {selectedTask ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(155,192,255,0.18)] bg-[rgba(77,137,255,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#9bc0ff] shadow-[0_0_0_1px_rgba(77,137,255,0.04)_inset]">
                    {formatStatusLabel(selectedTask.status)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-[#96a0b4]">
                    Local-first mode
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleSelectWorkspace}
                className="inline-flex h-10 max-w-[16rem] items-center gap-2 rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-3.5 text-sm text-[#f4f7fb] transition hover:border-[rgba(155,192,255,0.18)] hover:bg-[rgba(255,255,255,0.05)]"
              >
                <FolderOpen className="h-4 w-4 text-[#9bc0ff]" />
                <span className="hidden sm:inline">Workspace</span>
                <span className="max-w-[10rem] truncate text-[#96a0b4]">{workspaceLabel}</span>
              </button>

              <div className="hidden items-center gap-1.5 rounded-full border border-[rgba(155,192,255,0.14)] bg-[rgba(77,137,255,0.08)] px-3 py-1.5 text-xs text-[#9bc0ff] md:inline-flex">
                <div className="h-1.5 w-1.5 rounded-full bg-[#4d89ff] shadow-[0_0_12px_rgba(77,137,255,0.8)]" />
                Daemon connected
              </div>
            </div>
          </header>

          {!isTauri && (
            <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-950/20 px-4 py-2 text-xs text-amber-300 sm:px-6">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Tauri runtime unavailable — native folder selection and task execution are only available in the desktop app window.
              </span>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden">
            {!selectedTask ? (
              <div className="flex h-full min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                <div className="mx-auto flex w-full max-w-[760px] flex-col justify-center">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">Codra interface artifact</div>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      What should Codra do in this workspace?
                    </h2>
                    <p className="mx-auto mt-3 max-w-[42rem] text-sm leading-6 text-[#96a0b4] sm:text-[15px]">
                      Codra scans the workspace, drafts a plan, and waits for your approval before it touches files.
                    </p>
                  </div>

                  <div className="mt-7 rounded-[28px] border border-white/[0.08] bg-[rgba(11,15,24,0.9)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#070b12] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <FolderOpen className="h-4 w-4 shrink-0 text-[#9bc0ff]" />
                        <input
                          value={workspacePath}
                          onChange={(event) => {
                            setWorkspacePath(event.target.value);
                            setError(null);
                          }}
                          onBlur={() => {
                            if (workspacePath.trim()) {
                              localStorage.setItem(LAST_WORKSPACE_KEY, workspacePath.trim());
                            }
                          }}
                          placeholder="Select or type a workspace path"
                          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6f7889]"
                        />
                      </label>

                      <button
                        onClick={handleSelectWorkspace}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[rgba(155,192,255,0.18)] bg-[linear-gradient(180deg,rgba(77,137,255,1),rgba(50,102,222,1))] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,137,255,0.22),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition hover:translate-y-[-1px] hover:shadow-[0_14px_36px_rgba(77,137,255,0.26),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
                      >
                        {isTauri ? 'Browse workspace' : 'Open in Tauri'}
                      </button>
                    </div>

                    {workspaceContext ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#96a0b4]">
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                          Stack: {workspaceContext.detected_stack.slice(0, 2).join(' · ') || 'Unknown'}
                        </span>
                        {workspaceContext.git_branch && (
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                            Branch: {workspaceContext.git_branch}
                          </span>
                        )}
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                          {workspaceContext.is_git_repo ? 'Git repo' : 'Not a git repo'}
                        </span>
                        {workspaceContext.detected_config_files.slice(0, 2).map((file) => (
                          <span key={file} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                            {file}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <ModelPicker compact onChange={setModelConfig} />
                      {isScanningWorkspace && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#96a0b4]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#4d89ff] animate-pulse" />
                          Scanning workspace…
                        </span>
                      )}
                    </div>

                    <textarea
                      value={prompt}
                      onChange={(event) => {
                        setPrompt(event.target.value);
                        setError(null);
                      }}
                      placeholder="Ask Codra to edit, explain, fix, refactor, or verify this workspace…"
                      className="mt-4 min-h-[180px] w-full resize-y rounded-[22px] border border-white/[0.08] bg-[#070b12]/90 px-5 py-4 text-[15px] leading-6 text-white outline-none placeholder:text-[#6f7889] focus:border-[rgba(155,192,255,0.28)] focus:shadow-[0_0_0_1px_rgba(77,137,255,0.12),0_0_28px_rgba(77,137,255,0.08)]"
                    />

                    <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-[#96a0b4]">
                        Codra will not modify files until you approve the plan.
                      </div>
                      <button
                        onClick={handleCreateTask}
                        disabled={!canCreateTask}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Play className="h-4 w-4" />
                        {isCreatingTask ? 'Creating…' : 'Create Task'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <TaskThreadView
                task={selectedTask}
                events={events}
                workspacePath={workspacePath}
                workspaceContext={workspaceContext}
                modelLabel={modelLabel}
                onTaskUpdated={handleTaskUpdated}
                onRefreshEvents={refreshEvents}
              />
            )}
          </div>

          {error && (
            <div className="border-t border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300 sm:px-6">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
