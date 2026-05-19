import { useMemo, useState } from "react";
import { FolderOpen, Plus, Search, Settings } from "lucide-react";
import type { Task, WorkspaceContext } from "../lib/codraTaskApi";

interface ThreadSidebarProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
  onNewThread: () => void;
  onOpenWorkspace: () => void;
  currentWorkspace?: string;
  workspaceContext?: WorkspaceContext | null;
  className?: string;
}

export function ThreadSidebar({
  tasks,
  selectedTaskId,
  onSelectTask,
  onNewThread,
  onOpenWorkspace,
  currentWorkspace,
  workspaceContext,
  className,
}: ThreadSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.userPrompt.toLowerCase().includes(query) ||
        task.workspacePath.toLowerCase().includes(query)
      );
    });
  }, [search, tasks]);

  const recentCount = filteredTasks.length;

  return (
    <aside
      className={[
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,15,24,0.96),rgba(7,10,16,0.92))] shadow-[0_24px_80px_rgba(0,0,0,0.52)] backdrop-blur-[18px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-4 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(155,192,255,0.24)] bg-[linear-gradient(180deg,rgba(77,137,255,0.34),rgba(77,137,255,0.08))] shadow-[0_0_0_1px_rgba(77,137,255,0.08),0_0_24px_rgba(77,137,255,0.18)]">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg border border-white/[0.88]">
              <div className="flex h-3.5 w-3 items-stretch justify-between gap-0.5">
                <span className="block w-0.5 rounded-full bg-[#9bc0ff]" />
                <span className="block w-0.5 rounded-full bg-white/80" />
                <span className="block w-0.5 rounded-full bg-[#4d89ff]" />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-[-0.03em] text-white">
              Codra
            </div>
            <div className="mt-0.5 text-xs text-[#96a0b4]">
              Local-first agent
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            onClick={onNewThread}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-4 text-sm font-medium text-white transition hover:border-[rgba(155,192,255,0.18)] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <Plus className="h-4 w-4" />
            New thread
          </button>

          <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#070b12] px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Search className="h-4 w-4 shrink-0 text-[#6f7889]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search threads, workspaces…"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6f7889]"
            />
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-hide sm:px-4">
        <section className="section-space">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
              Recent task threads
            </div>
            <span className="inline-flex items-center rounded-full border border-[rgba(155,192,255,0.16)] bg-[rgba(77,137,255,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#9bc0ff]">
              {recentCount} {recentCount === 1 ? "thread" : "threads"}
            </span>
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="rounded-[22px] border border-white/[0.06] bg-[#0a0f18] px-4 py-4 text-sm text-[#96a0b4]">
                No threads yet.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <ThreadItem
                  key={task.id}
                  task={task}
                  active={selectedTaskId === task.id}
                  onClick={() => onSelectTask(task)}
                />
              ))
            )}
          </div>
        </section>

        <section className="section-space mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
              Workspace
            </div>
            <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-[#96a0b4]">
              Local-first
            </span>
          </div>

          <button
            onClick={onOpenWorkspace}
            className="w-full rounded-[22px] border border-white/[0.06] bg-[#0a0f18] p-4 text-left transition hover:border-[rgba(155,192,255,0.18)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[#9bc0ff]">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                  {currentWorkspace
                    ? basename(currentWorkspace)
                    : "Select workspace"}
                </div>
                <div className="mt-1 truncate text-xs leading-5 text-[#96a0b4]">
                  {workspaceContext?.detectedStack.slice(0, 2).join(" · ") ||
                    "Workspace path and scan summary"}
                </div>
              </div>
            </div>
          </button>
        </section>

        <section className="section-space mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
              Memory
            </div>
            <span className="inline-flex items-center rounded-full border border-[rgba(240,179,95,0.16)] bg-[rgba(240,179,95,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#f0b35f]">
              Relevant
            </span>
          </div>

          <div className="rounded-[22px] border border-white/[0.06] bg-[#0a0f18] p-4">
            <div className="text-sm font-medium text-white">
              Memory layer coming next.
            </div>
            <p className="mt-2 text-sm leading-6 text-[#96a0b4]">
              Project facts, approval habits, and task-specific reminders will
              surface here once persistence is wired in.
            </p>
          </div>
        </section>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="rounded-[22px] border border-white/[0.06] bg-[#0a0f18] p-4 text-xs text-[#96a0b4]">
          <div className="flex items-center justify-between gap-3">
            <span>Codra Core</span>
            <strong className="inline-flex items-center gap-1.5 text-[#9bc0ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4d89ff] shadow-[0_0_10px_rgba(77,137,255,0.8)]" />
              Running
            </strong>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Daemon</span>
            <strong className="inline-flex items-center gap-1.5 text-[#9bc0ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4d89ff] shadow-[0_0_10px_rgba(77,137,255,0.8)]" />
              Connected
            </strong>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Mode</span>
            <strong className="text-white">Local-first mode</strong>
          </div>

          <div className="mt-3 border-t border-white/[0.05] pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[#96a0b4]">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </span>
              <strong className="text-white">Open</strong>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>Audit</span>
              <strong className="text-[#96a0b4]">Safe approvals</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ThreadItem({
  task,
  active,
  onClick,
}: {
  task: Task;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-[22px] border px-4 py-3 text-left transition",
        active
          ? "border-[rgba(155,192,255,0.28)] bg-[rgba(77,137,255,0.1)] shadow-[0_0_0_1px_rgba(77,137,255,0.08)_inset,0_16px_32px_rgba(0,0,0,0.18)]"
          : "border-white/[0.06] bg-[#0a0f18] hover:border-[rgba(155,192,255,0.14)] hover:bg-[rgba(255,255,255,0.04)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">
            {task.title || task.userPrompt.slice(0, 48)}
          </div>
          <div className="mt-1 truncate text-xs leading-5 text-[#96a0b4]">
            {task.userPrompt}
          </div>
        </div>
        <StatusChip status={task.status} />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-[#6f7889]">
        <span className="truncate">{basename(task.workspacePath)}</span>
        <span>·</span>
        <span>{formatTime(task.updatedAt)}</span>
      </div>
    </button>
  );
}

function StatusChip({ status }: { status: Task["status"] }) {
  const { className, label } = statusChipInfo(status);
  return <span className={className}>{label}</span>;
}

function statusChipInfo(status: Task["status"]) {
  switch (status) {
    case "awaiting_approval":
      return {
        label: "Awaiting approval",
        className:
          "inline-flex shrink-0 items-center rounded-full border border-[rgba(155,192,255,0.16)] bg-[rgba(77,137,255,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#9bc0ff]",
      };
    case "approved":
      return {
        label: "Approved",
        className:
          "inline-flex shrink-0 items-center rounded-full border border-[rgba(155,192,255,0.16)] bg-[rgba(77,137,255,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#9bc0ff]",
      };
    case "planning":
    case "executing":
    case "verifying":
    case "repair_planning":
    case "repairing":
      return {
        label: formatStatusLabel(status),
        className:
          "inline-flex shrink-0 items-center rounded-full border border-[rgba(240,179,95,0.16)] bg-[rgba(240,179,95,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#f0b35f]",
      };
    case "awaiting_repair_approval":
      return {
        label: "Repair approval",
        className:
          "inline-flex shrink-0 items-center rounded-full border border-[rgba(240,125,151,0.16)] bg-[rgba(240,125,151,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#f07d97]",
      };
    case "completed":
      return {
        label: "Completed",
        className:
          "inline-flex shrink-0 items-center rounded-full border border-[rgba(77,137,255,0.16)] bg-[rgba(77,137,255,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#9bc0ff]",
      };
    case "cancelled":
    case "failed":
    case "draft":
    default:
      return {
        label: formatStatusLabel(status),
        className:
          "inline-flex shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-[#96a0b4]",
      };
  }
}

function basename(path: string) {
  const normalized = path.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || normalized || "Workspace";
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

function formatTime(input: string) {
  try {
    return new Date(parseTaskTimestamp(input)).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return input;
  }
}
