import { useEffect, useState } from 'react';
import {
  createTask,
  listTasks,
  getTaskEvents,
  scanWorkspace,
} from './lib/codraTaskApi';
import type { Task, TaskEvent, WorkspaceContext } from './lib/codraTaskApi';
import { ThreadSidebar } from './components/ThreadSidebar';
import { TaskThreadView } from './components/TaskThreadView';
import { ModelPicker } from './components/ModelPicker';
import type { ModelConfig } from './lib/modelConfig';
import { loadModelConfig, getModelLabel } from './lib/modelConfig';
import { FolderOpen, Settings, Play } from 'lucide-react';
import { selectWorkspaceFolder } from './lib/workspacePicker';
import { isTauriRuntime } from './lib/tauriRuntime';

export default function App() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [workspacePath, setWorkspacePath] = useState('');
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(loadModelConfig());
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);

  const isTauri = isTauriRuntime();

  useEffect(() => {
    loadTasks();
    const lastWs = localStorage.getItem('codra_last_workspace');
    if (lastWs) setWorkspacePath(lastWs);
  }, []);

  async function loadTasks() {
    try { await listTasks(); } catch {}
  }

  async function loadTaskEvents(taskId: string) {
    try {
      const evts = await getTaskEvents(taskId);
      setEvents(evts);
    } catch {}
  }

  function handleNewThread() {
    setSelectedTask(null);
    setEvents([]);
    setPrompt('');
    setError(null);
  }

  async function handleSelectTask(task: Task) {
    setSelectedTask(task);
    await loadTaskEvents(task.id);
  }

  async function handleSelectWorkspace() {
    if (!isTauri) {
      setError('Open Codra in the Tauri app window to use native folder picker.');
      setShowWorkspaceInput(true);
      return;
    }

    try {
      const folder = await selectWorkspaceFolder();
      if (folder) {
        setWorkspacePath(folder);
        localStorage.setItem('codra_last_workspace', folder);
        setError(null);
        // Auto-scan after selection
        await handleScanWorkspaceWithPath(folder);
      }
    } catch (e: any) {
      setError('Failed to select workspace: ' + String(e));
    }
  }

  async function handleScanWorkspaceWithPath(path: string) {
    if (!path.trim()) return;
    setLoading(true);
    try {
      const ctx = await scanWorkspace(path.trim());
      setWorkspaceContext(ctx);
    } catch (e: any) {
      setError('Failed to scan workspace: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleScanWorkspace() {
    await handleScanWorkspaceWithPath(workspacePath);
  }

  async function handleSubmitTask() {
    if (!workspacePath.trim()) {
      setError('Workspace path is required.');
      return;
    }
    if (!prompt.trim()) {
      setError('Prompt is required.');
      return;
    }
    if (!isTauri) {
      setError('Tauri runtime unavailable. Open Codra in the desktop app window.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newTask = await createTask({
        workspace_path: workspacePath.trim(),
        user_prompt: prompt.trim(),
        title: prompt.trim().slice(0, 60),
      });
      setSelectedTask(newTask);
      await loadTaskEvents(newTask.id);
      setPrompt('');
    } catch (e: any) {
      setError('Failed to create task: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleTaskUpdated(updated: Task) {
    setSelectedTask(updated);
  }

  function handleModelChange(cfg: ModelConfig) {
    setModelConfig(cfg);
  }

  const modelLabel = getModelLabel(modelConfig.selectedProvider, modelConfig.selectedModel);
  const canRun = Boolean(workspacePath.trim() && prompt.trim());

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060910] text-zinc-100">
      {/* Left Sidebar */}
      <ThreadSidebar
        selectedTaskId={selectedTask?.id || null}
        onSelectTask={handleSelectTask}
        onNewThread={handleNewThread}
        onOpenWorkspace={handleSelectWorkspace}
        currentWorkspace={workspacePath}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Premium Top App Bar */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#070b12] px-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-tight text-white">
              {selectedTask ? selectedTask.title || 'Thread' : 'New thread'}
            </span>
            {workspacePath && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.035] px-3 py-0.5 text-xs text-zinc-400">
                <FolderOpen className="h-3 w-3" />
                {workspacePath.split('/').pop()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setShowWorkspaceInput(!showWorkspaceInput)}
              className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-1 text-xs hover:bg-white/[0.04]"
            >
              Workspace
            </button>
            <button className="rounded-md p-2 hover:bg-white/[0.04]">
              <Settings className="h-4 w-4" />
            </button>
            <div className="ml-1 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected
            </div>
          </div>
        </div>

        
        { !isTauri && (
          <div className="border-b border-amber-500/30 bg-amber-950/30 px-6 py-1.5 text-xs text-amber-400">
            Tauri runtime unavailable — native workspace picker and task execution require the desktop app window.
          </div>
        )}
        {/* Workspace input row */}
        {showWorkspaceInput && (
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0a0f18] px-6 py-3">
            <input
              value={workspacePath}
              onChange={(e) => setWorkspacePath(e.target.value)}
              placeholder="/path/to/your/project"
              className="flex-1 rounded-md border border-white/[0.08] bg-[#111724] px-4 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={handleScanWorkspace}
              disabled={loading}
              className="rounded-md border border-white/[0.1] px-4 py-2 text-sm hover:bg-white/[0.05]"
            >
              Scan
            </button>
            {workspaceContext && (
              <span className="text-xs text-emerald-400">{workspaceContext.detected_stack.join(', ')}</span>
            )}
          </div>
        )}

        {/* Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Empty State + Composer */}
          {!selectedTask && (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="w-full max-w-[640px]">
                <div className="mb-8 text-center">
                  <div className="text-4xl font-semibold tracking-tighter text-white">
                    What should Codra do in this folder?
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    Codra will scan the workspace, create a plan, and execute only after your approval.
                  </p>
                </div>

                {/* Premium Composer Card */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0f18] p-1.5 shadow-2xl">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Codra to edit, explain, fix, refactor, or verify this workspace…"
                    className="min-h-[130px] w-full resize-y bg-transparent px-5 py-4 text-[15px] placeholder:text-zinc-500 focus:outline-none"
                  />

                  {/* Composer Footer */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs text-zinc-400 hover:bg-white/[0.04]">
                        <FolderOpen className="h-3.5 w-3.5" /> Context
                      </button>
                      <ModelPicker compact onChange={handleModelChange} />
                    </div>

                    <div className="flex items-center gap-2">
                      {!workspacePath && (
                        <span className="text-xs text-amber-400">Select workspace to enable Run Task</span>
                      )}
                      <button
                        onClick={handleSubmitTask}
                        disabled={loading || !canRun}
                        className="flex items-center gap-2 rounded-lg bg-white px-6 py-2 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 active:bg-white"
                      >
                        <Play className="h-4 w-4" />
                        {loading ? 'Creating…' : 'Create Task'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-[10px] text-zinc-500">
                  Codra will not modify files until you approve the plan.
                </div>
              </div>
            </div>
          )}

          {/* Thread View */}
          {selectedTask && (
            <TaskThreadView
              task={selectedTask}
              events={events}
              onTaskUpdated={handleTaskUpdated}
              workspacePath={workspacePath}
              modelLabel={modelLabel}
            />
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="border-t border-rose-500/30 bg-rose-950/30 px-6 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
