import { useEffect, useState } from 'react';
import { Plus, Search, FolderOpen, Settings } from 'lucide-react';
import type { Task } from '../lib/codraTaskApi';
import { listTasks } from '../lib/codraTaskApi';

interface ThreadSidebarProps {
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
  onNewThread: () => void;
  onOpenWorkspace: () => void;
  currentWorkspace?: string;
}

export function ThreadSidebar({
  selectedTaskId,
  onSelectTask,
  onNewThread,
  onOpenWorkspace,
  currentWorkspace,
}: ThreadSidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const result = await listTasks();
      setTasks(result);
    } catch {
      setTasks([]);
    }
  }

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.user_prompt.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((t) => t.status === 'Completed');
  const recent = filtered.filter((t) => t.status !== 'Completed');

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-[#05080f]">
      {/* Header with premium branding */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 shadow-inner">
          <span className="font-mono text-sm font-bold text-white">&lt;/&gt;</span>
        </div>
        <div>
          <div className="font-semibold tracking-tighter text-white">Codra</div>
          <div className="text-[10px] text-zinc-500">Local agent</div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads..."
            className="w-full rounded-md border border-white/[0.06] bg-[#0a0f18] py-2 pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.1]"
          />
        </div>
      </div>

      {/* New Thread Button */}
      <button
        onClick={onNewThread}
        className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-sm font-medium hover:bg-white/[0.05] active:bg-white/[0.08]"
      >
        <Plus className="h-4 w-4" /> New thread
      </button>

      {/* Workspace quick access */}
      <button
        onClick={onOpenWorkspace}
        className="mx-3 mb-4 flex items-center gap-2 rounded-md border border-white/[0.06] px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/[0.04]"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        <span className="truncate">{currentWorkspace || 'Select workspace'}</span>
      </button>

      {/* Threads section */}
      <div className="flex-1 overflow-y-auto px-2 text-sm">
        {pinned.length > 0 && (
          <div className="mb-1 px-2 text-[10px] uppercase tracking-[1.5px] text-zinc-500">Pinned</div>
        )}
        {pinned.map((task) => (
          <ThreadItem
            key={task.id}
            task={task}
            active={selectedTaskId === task.id}
            onClick={() => onSelectTask(task)}
          />
        ))}

        <div className="mt-4 mb-1 px-2 text-[10px] uppercase tracking-[1.5px] text-zinc-500">Recent</div>
        {recent.length === 0 && (
          <div className="px-3 py-3 text-xs text-zinc-500">No threads yet</div>
        )}
        {recent.map((task) => (
          <ThreadItem
            key={task.id}
            task={task}
            active={selectedTaskId === task.id}
            onClick={() => onSelectTask(task)}
          />
        ))}
      </div>

      {/* Premium Footer Status */}
      <div className="border-t border-white/[0.06] px-4 py-3 text-[10px]">
        <div className="space-y-1.5 text-zinc-500">
          <div className="flex items-center justify-between">
            <span>Codra Core</span>
            <span className="text-emerald-400">● Running</span>
          </div>
          <div>Workspace write: <span className="text-emerald-400">Enabled</span></div>
          <div>Tools: <span className="text-zinc-400">12 active</span></div>
          <div className="pt-1 border-t border-white/[0.05] flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer">
            <Settings className="h-3 w-3" /> Settings
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadItem({ task, active, onClick }: { task: Task; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`mb-0.5 w-full rounded-md px-3 py-2 text-left transition-all ${
        active ? 'bg-violet-600/15 text-white' : 'hover:bg-white/[0.035] text-zinc-300'
      }`}
    >
      <div className="truncate text-sm font-medium">{task.title || task.user_prompt.slice(0, 48)}</div>
      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
        <span>{task.status}</span>
        <span>·</span>
        <span className="truncate">{task.workspace_path.split('/').pop()}</span>
      </div>
    </button>
  );
}
