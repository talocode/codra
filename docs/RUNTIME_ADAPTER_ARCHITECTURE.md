# Codra Runtime Adapter Architecture

## Files Inspected

| File | Relevance |
|------|-----------|
| `docs/ARCHITECTURE.md` | Current system architecture |
| `docs/PLAN.md` | Product vision & goals |
| `crates/codra-protocol/src/lib.rs` | All shared Rust domain types (Task, TaskStatus, ProviderKind, SafetyMode, ToolDefinition, TimelineEvent, etc.) |
| `crates/codra-core/src/lib.rs` | Module declarations, `ExecutionContext` |
| `crates/codra-core/src/provider.rs` | `IntelligenceProvider` trait, `LiveProvider` bridge, `ModelProvider`/`ExecutionProvider`/`VerificationProvider` subsystem traits, provider factory |
| `crates/codra-core/src/services.rs` | Trait interfaces: WorkspaceService, RepoService, SearchService, FileService, ExecutionService, CheckpointService |
| `crates/codra-core/src/task_store.rs` | JSON-file-backed task persistence + event journaling |
| `crates/codra-core/src/task_lifecycle.rs` | Task state machine |
| `crates/codra-core/src/task_executor.rs` | Task execution with file changes + backups |
| `crates/codra-core/src/task_planner.rs` | Workflow planner |
| `crates/codra-core/src/task_verifier.rs` | Verification runner |
| `crates/codra-core/src/command_runner.rs` | `CommandRunner` trait |
| `crates/codra-core/src/command_safety.rs` | Allowlist/danger-pattern checking |
| `crates/codra-core/src/file_changes.rs` | Path traversal validation + backup creation |
| `crates/codra-core/src/planner.rs` | `PlannerService` using `ModelProvider` |
| `crates/codra-core/src/executor.rs` | `ExecutionOrchestrator` using `ExecutionProvider` |
| `crates/codra-core/src/verifier.rs` | `VerificationService` using `VerificationProvider` |
| `crates/codra-core/src/repair.rs` | `RepairService` using `IntelligenceProvider` |
| `crates/codra-core/src/config.rs` | `GlobalConfigService` |
| `crates/codra-core/src/provider_config.rs` | `ProviderConfigService` |
| `crates/codra-daemon/src/main.rs` | Axum HTTP API: health, workspace, CRUD tasks, SSE stream, auth middleware |
| `crates/codra-daemon/src/state.rs` | `DaemonState` — instantiates all services |
| `crates/codra-tools/src/lib.rs` | `Tool` trait, tool registry |
| `crates/codra-tools/src/registry.rs` | 9 builtin tool definitions |
| `crates/codra-tools/src/fs.rs` | `LocalFileSystem` — safe path resolution + checkpointing |
| `crates/codra-tools/src/search.rs` | `LocalSearch` — regex grep |
| `crates/codra-tools/src/terminal.rs` | `LocalTerminal` — shell command execution |
| `crates/codra-tools/src/git.rs` | `LocalGit` — git status/diff |
| `crates/codra-cli/src/main.rs` | CLI binary: smoke, provider check, headless, mcp-server |
| `crates/codra-memory/src/lib.rs` | `MemoryStore` trait (minimal) |
| `crates/codra-deploy/src/lib.rs` | `Deployer` trait (minimal) |
| `apps/desktop/src/lib/codraTaskApi.ts` | Tauri command bindings (35 commands) |
| `apps/desktop/src/lib/modelConfig.ts` | Provider definitions (Codex, Claude, Cursor, Gemini, Kilo, OpenCode, Pi, Local) |
| `apps/desktop/src/lib/tauriRuntime.ts` | Tauri v2 runtime detection |
| `apps/desktop/src-tauri/src/lib.rs` | All Tauri command handlers (909 lines), `AppState` with 7 mutex fields, RuntimeMode + SafetyMode |
| `packages/shared/src/runtime.ts` | TS runtime types: SafetyMode, RuntimeMode, TimelineSource, TimelineEvent |
| `packages/shared/src/task-loop.ts` | TS task types matching codra-protocol |
| `packages/shared/src/core.ts` | TS baseline types: AgentTask, WorkspaceSummary, etc. |

---

## Current Runtime Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT RUNTIME STACK                      │
│                                                               │
│  ┌──────────┐   ┌──────────────────────────────────────┐     │
│  │ Desktop  │──▶│  Tauri Backend (lib.rs)              │     │
│  │ (React)  │   │  - AppState (7 mutex fields)         │     │
│  │          │   │  - 35 command handlers               │     │
│  │          │   │  - SafetyMode / RuntimeMode          │     │
│  └──────────┘   └──────────┬───────────────────────────┘     │
│                            │                                  │
│  ┌──────────┐   ┌──────────▼───────────────────────────┐     │
│  │ Daemon   │──▶│  codra-daemon (Axum HTTP)            │     │
│  │ (HTTP)   │   │  - /api/tasks CRUD                    │     │
│  │          │   │  - SSE event streaming                │     │
│  │          │   │  - Bearer token auth                  │     │
│  └──────────┘   └──────────┬───────────────────────────┘     │
│                            │                                  │
│  ┌──────────┐   ┌──────────▼───────────────────────────┐     │
│  │ CLI      │──▶│  codra-cli (binary)                  │     │
│  │ (shell)  │   │  - smoke / provider / headless        │     │
│  └──────────┘   └──────────┬───────────────────────────┘     │
│                            │                                  │
│               ┌────────────▼────────────────────────────┐    │
│               │           codra-core (engine)            │    │
│               │                                          │    │
│               │  ┌──────────────────────────────────┐    │    │
│               │  │  Provider Layer                  │    │    │
│               │  │  - IntelligenceProvider (trait)   │    │    │
│               │  │  - create_provider() (factory)    │    │    │
│               │  │  - LiveProvider (bridge)          │    │    │
│               │  │  - OllamaProvider                 │    │    │
│               │  │  - OpenAiCompatibleProvider       │    │    │
│               │  │  - EchoMockProvider               │    │    │
│               │  └──────────────────────────────────┘    │    │
│               │                                          │    │
│               │  ┌──────────────────────────────────┐    │    │
│               │  │  Task Lifecycle                  │    │    │
│               │  │  TaskPlanner → TaskExecutor →    │    │    │
│               │  │  TaskVerifier (+ Repair cycle)    │    │    │
│               │  └──────────────────────────────────┘    │    │
│               │                                          │    │
│               │  ┌──────────────────────────────────┐    │    │
│               │  │  Planner-Executor-Verifier       │    │    │
│               │  │  Cycle (original v0.1)           │    │    │
│               │  │  PlannerService → ExecutionOrch   │    │    │
│               │  │  → VerifierService → RepairSvc   │    │    │
│               │  └──────────────────────────────────┘    │    │
│               │                                          │    │
│               │  ┌──────────────────────────────────┐    │    │
│               │  │  Safety Layer                    │    │    │
│               │  │  - SafetyMode                    │    │    │
│               │  │  - CommandSafetyResult            │    │    │
│               │  │  - ToolSafetyLevel               │    │    │
│               │  │  - Path traversal protection      │    │    │
│               │  │  - File change backup/restore     │    │    │
│               │  └──────────────────────────────────┘    │    │
│               └──────────────────────────────────────────┘    │
│                                                               │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────┐      │
│  │ codra-tools   │  │ codra-browser│  │ codra-memory  │      │
│  │ - Tool trait  │  │ - CDP-based  │  │ - MemoryStore │      │
│  │ - FS, Search  │  │ - Browser    │  │   (trait only)│      │
│  │ - Git,Terminal│  │   Sessions   │  └───────────────┘      │
│  │ - ComputerUse │  └──────────────┘  ┌───────────────┐      │
│  │ - Design Sys  │                    │ codra-deploy  │      │
│  └───────────────┘                    │ - Deployer    │      │
│                                       │   (trait only)│      │
│                                       └───────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Current hard-wired assumptions:**
- Task lifecycle is linear (Draft → Planning → AwaitingApproval → Approved → Executing → Verifying → Completed|Failed|Cancelled)
- Provider = LLM generation endpoint (not a runtime)
- Sessions = single task, no resume/fork/clone/handoff
- Event streaming = polling-based SSE (1s interval)
- Desktop is the only rich frontend
- No approval-first execution enforcement at the engine boundary — approval is a status in the state machine, not an interceptor

---

## Proposed `CodraRuntime` Interface

```rust
/// The core trait every runtime adapter implements.
///
/// A "runtime" is any system that can execute agent tasks:
/// - A local SDK (Codex SDK, Cursor SDK)
/// - A CLI tool (Claude Code, OpenCode, Pi, Hermes)
/// - A cloud service (Codex Cloud/Web)
/// - A direct model endpoint (OpenAI, Anthropic, Gemini, Ollama)
pub trait CodraRuntime: Send + Sync {
    // ── Lifecycle ──────────────────────────────────────────────

    /// Unique identifier for this runtime instance.
    fn id(&self) -> &str;

    /// Human-readable name (e.g. "Codex SDK Agent", "Claude Code CLI").
    fn name(&self) -> &str;

    /// The runtime category.
    fn category(&self) -> RuntimeCategory;

    /// Initialize the runtime (check connectivity, authenticate, set up workspace).
    fn init(&self, config: RuntimeConfig) -> Result<RuntimeStatus, RuntimeError>;

    /// Clean shutdown.
    fn shutdown(&self) -> Result<(), RuntimeError>;

    // ── Session Management ─────────────────────────────────────

    /// Create a new session with a user prompt and workspace context.
    fn create_session(&self, request: SessionRequest) -> Result<SessionHandle, RuntimeError>;

    /// Resume a previously paused/saved session.
    fn resume_session(&self, session_id: &str) -> Result<SessionHandle, RuntimeError>;

    /// Fork an existing session into a new independent session.
    fn fork_session(&self, session_id: &str, new_prompt: Option<String>) -> Result<SessionHandle, RuntimeError>;

    /// Clone a session (same state, new ID — for handoff to another runtime).
    fn clone_session(&self, session_id: &str) -> Result<SessionHandle, RuntimeError>;

    /// Handoff a session to another runtime adapter.
    fn handoff_session(&self, session_id: &str, target_runtime: &str) -> Result<(), RuntimeError>;

    /// List all active sessions.
    fn list_sessions(&self) -> Result<Vec<SessionInfo>, RuntimeError>;

    /// Get session state.
    fn get_session(&self, session_id: &str) -> Result<SessionInfo, RuntimeError>;

    /// Pause/cancel a session.
    fn cancel_session(&self, session_id: &str, reason: Option<String>) -> Result<(), RuntimeError>;

    // ── Task Execution ─────────────────────────────────────────

    /// Submit a task for execution within a session.
    fn submit_task(&self, session_id: &str, prompt: &str) -> Result<TaskHandle, RuntimeError>;

    /// Approve a pending action (file change, command, tool call).
    fn approve_action(&self, session_id: &str, action_id: &str) -> Result<(), RuntimeError>;

    /// Reject a pending action.
    fn reject_action(&self, session_id: &str, action_id: &str, reason: Option<String>) -> Result<(), RuntimeError>;

    /// Get current task state.
    fn get_task(&self, session_id: &str, task_id: &str) -> Result<TaskState, RuntimeError>;

    /// Cancel a running task.
    fn cancel_task(&self, session_id: &str, task_id: &str) -> Result<(), RuntimeError>;

    // ── Event Streaming ────────────────────────────────────────

    /// Subscribe to events from a session or task.
    /// Returns a receiver that yields RuntimeEvent items.
    fn subscribe(&self, session_id: &str, filter: Option<EventFilter>) -> Box<dyn EventReceiver>;

    /// Get historical events.
    fn get_events(&self, session_id: &str, since: Option<String>) -> Result<Vec<RuntimeEvent>, RuntimeError>;

    // ── Configuration ──────────────────────────────────────────

    /// Get runtime capabilities (features, tool count, model info).
    fn capabilities(&self) -> RuntimeCapabilities;

    /// Apply runtime-level configuration.
    fn configure(&self, config: RuntimeConfig) -> Result<(), RuntimeError>;
}
```

### Runtime Categories

```rust
pub enum RuntimeCategory {
    /// Embedded agent runtime (Codex SDK, Cursor SDK — local process).
    LocalAgent,

    /// External CLI tool launched as a subprocess (Claude Code, OpenCode, Pi, Hermes).
    CliAgent,

    /// Cloud-hosted agent service (Codex Cloud-style background tasks, future Codra Cloud).
    CloudAgent,

    /// Direct LLM API call with no agent loop (use Codra's own Planner/Executor/Verifier cycle).
    DirectModel,

    /// Local LLM (Ollama, LM Studio, llama.cpp) with Codra's own agent loop.
    LocalModel,

    /// Computer-use agent runtime (Cua-like sandbox, browser automation, GUI control).
    /// Can see screen state, click, type, run shell commands, and verify UI outcomes.
    /// Runs in a sandboxed environment, not on the user's host directly.
    ComputerUseAgent,

    /// Sandboxed agent runtime (container/VM-isolated execution for risky tasks).
    /// Provides full filesystem/network isolation from the user's main machine.
    /// Often hosts a ComputerUseAgent inside the sandbox.
    SandboxAgent,
}
```

### Core Data Types

```rust
pub struct RuntimeConfig {
    pub workspace_path: Option<String>,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model_id: Option<String>,
    pub safety_config: SafetyConfig,
    pub env: HashMap<String, String>,
    pub extra: HashMap<String, serde_json::Value>,
}

pub struct SafetyConfig {
    pub allowed_commands: Vec<String>,
    pub blocked_commands: Vec<String>,
    pub allowed_paths: Vec<String>,
    pub blocked_paths: Vec<String>,
    pub require_approval_for: Vec<ActionKind>,
    pub env_protected_keys: Vec<String>,
    pub max_concurrent_tasks: usize,
}

pub struct RuntimeStatus {
    pub connected: bool,
    pub ready: bool,
    pub version: Option<String>,
    pub health: String,
    pub authenticated: bool,
}

pub struct SessionRequest {
    pub workspace_path: String,
    pub user_prompt: String,
    pub initial_context: Option<SessionContext>,
    pub safety_override: Option<SafetyConfig>,
    pub metadata: HashMap<String, String>,
}

pub struct SessionContext {
    pub open_files: Vec<String>,
    pub git_branch: Option<String>,
    pub recent_commands: Vec<String>,
    pub recent_events: Vec<RuntimeEvent>,
}

pub struct SessionHandle {
    pub session_id: String,
    pub runtime_id: String,
    pub created_at: String,
    pub status: SessionStatus,
}

pub struct SessionInfo {
    pub session_id: String,
    pub runtime_id: String,
    pub runtime_name: String,
    pub workspace_path: String,
    pub status: SessionStatus,
    pub created_at: String,
    pub updated_at: String,
    pub active_task: Option<String>,
    pub event_count: usize,
}

pub enum SessionStatus {
    Active,
    Paused,
    AwaitingApproval,
    Completed,
    Cancelled,
    Failed,
    HandedOff,
}

pub struct TaskHandle {
    pub task_id: String,
    pub session_id: String,
    pub status: TaskStatus,
}

pub struct TaskState {
    pub task_id: String,
    pub session_id: String,
    pub status: TaskStatus,
    pub prompt: String,
    pub plan: Option<TaskPlan>,
    pub pending_actions: Vec<PendingAction>,
    pub completed_actions: Vec<CompletedAction>,
    pub events: Vec<RuntimeEvent>,
    pub result: Option<TaskResult>,
}

pub struct PendingAction {
    pub id: String,
    pub kind: ActionKind,
    pub description: String,
    pub details: serde_json::Value,
    pub created_at: String,
}

pub struct CompletedAction {
    pub id: String,
    pub kind: ActionKind,
    pub description: String,
    pub approved: bool,
    pub result: serde_json::Value,
    pub completed_at: String,
}

pub struct TaskPlan {
    pub summary: String,
    pub steps: Vec<TaskStep>,
    pub files_to_read: Vec<String>,
    pub files_to_modify: Vec<String>,
    pub commands_to_run: Vec<String>,
    pub risk_level: String,
    pub requires_approval: bool,
}

pub struct TaskStep {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
}

pub enum ActionKind {
    ReadFile,
    WriteFile,
    EditFile,
    RunCommand,
    Search,
    GitOperation,
    BrowserAction,
    ComputerUse,
    NetworkRequest,
    InstallDependency,
    Deploy,
}

pub struct TaskResult {
    pub success: bool,
    pub summary: String,
    pub changed_files: Vec<FileChangeRecord>,
    pub commands_run: Vec<CommandRunRecord>,
    pub error: Option<String>,
}

pub struct FileChangeRecord {
    pub path: String,
    pub change_type: String,
    pub diff: Option<String>,
}

pub struct CommandRunRecord {
    pub command: String,
    pub exit_code: i32,
    pub stdout_preview: Option<String>,
    pub stderr_preview: Option<String>,
}

impl TaskStatus {
    /// Reused from codra-protocol — the same 12-state machine.
    /// Draft, Planning, AwaitingApproval, Approved, Executing,
    /// Verifying, RepairPlanning, AwaitingRepairApproval, Repairing,
    /// Completed, Failed, Cancelled.
}
```

### Event Types

```rust
pub struct RuntimeEvent {
    pub id: String,
    pub timestamp: String,
    pub session_id: String,
    pub task_id: Option<String>,
    pub kind: EventKind,
    pub source: String,          // runtime name that emitted it
    pub payload: serde_json::Value,
}

pub enum EventKind {
    SessionCreated,
    SessionResumed,
    SessionPaused,
    SessionCancelled,
    SessionHandedOff,

    TaskCreated,
    TaskPlanning,
    TaskPlanReady,
    TaskAwaitingApproval,
    TaskApproved,
    TaskRejected,
    TaskExecuting,
    TaskActionPending,       // awaiting user approval
    TaskActionApproved,
    TaskActionRejected,
    TaskVerifying,
    TaskRepairing,
    TaskCompleted,
    TaskFailed,
    TaskCancelled,
    TaskLog,                 // arbitrary log line

    RuntimeLog,              // runtime-level diagnostic
    RuntimeError,
    RuntimeDisconnected,
    RuntimeReconnected,

    ToolCall,
    ToolResult,
    ModelGeneration,
    ModelStreamChunk,

    ApprovalRequested,
    ApprovalGranted,
    ApprovalDenied,
}

pub struct EventFilter {
    pub kinds: Option<Vec<EventKind>>,
    pub since: Option<String>,
    pub limit: Option<usize>,
}

pub trait EventReceiver: Send {
    fn recv(&mut self) -> Result<Option<RuntimeEvent>, RuntimeError>;
    fn try_recv(&mut self) -> Option<RuntimeEvent>;
    fn close(&mut self);
}
```

### Runtime Capabilities

```rust
pub struct RuntimeCapabilities {
    pub supports_sessions: bool,
    pub supports_resume: bool,
    pub supports_fork: bool,
    pub supports_clone: bool,
    pub supports_handoff: bool,
    pub supports_approval: bool,
    pub supports_event_streaming: bool,
    pub supports_planning: bool,
    pub supports_verification: bool,
    pub supports_repair: bool,

    // ── Computer-Use & Sandbox Capabilities ─────────────────
    /// Can observe and interact with the OS GUI (click, type, drag, scroll).
    pub supports_gui_control: bool,
    /// Can capture screen state as images (full-screen, window, region).
    pub supports_screenshot: bool,
    /// Can record and replay task trajectories (events + screenshots at each step).
    pub supports_replay: bool,
    /// Runs in an isolated sandbox (container/VM) with no host filesystem access.
    pub supports_sandbox: bool,
    /// Can launch and control a headless or headed web browser.
    pub supports_browser: bool,
    /// Can control mobile device emulators or physical devices (ADB, simulators).
    pub supports_mobile_device: bool,

    pub max_concurrent_sessions: usize,
    pub available_tools: Vec<String>,
    pub model_info: Option<ModelInfo>,
    pub streaming: bool,
}
```

---

## Runtime Adapter Mapping

### 1. Codex SDK → `LocalAgent` Runtime

The [OpenAI Codex SDK](https://developers.openai.com/codex/sdk) provides a local agent runtime with:
- An agent loop (perception → thought → action → observation)
- Tool use (read/write file, terminal, search)
- Approval requests before file edits and command execution
- Event streaming via the SDK's observer pattern
- Session management with the `Codex` class

**Adapter approach:**
- Wrap the Codex SDK's `Codex` class in a Rust FFI boundary (or spawn as a sidecar process communicating over a local socket/JSON-RPC)
- Map Codex's `AgentRun`, `AgentEvent` types into `CodraRuntime` types
- Map Codex approval requests into `PendingAction` items
- Codex SDK already provides: session, agent, tool, approval, events — the adapter is primarily a type mapping layer

```
Codex SDK                      CodraRuntime
──────────                     ─────────────
Codex::create()       ──────▶  init()
Codex.run()           ──────▶  submit_task()
AgentRun.on_approval  ──────▶  approve_action() / reject_action()
AgentRun.events()     ──────▶  subscribe() / get_events()
AgentRun.cancel()     ──────▶  cancel_task()
```

### 2. Codex Cloud → `CloudAgent` Runtime

The [Codex Cloud API](https://developers.openai.com/codex/cloud) provides:
- Background task submission
- Webhook-based event delivery
- Persistent sessions with resume capability
- Quotas, usage tracking, org management

**Adapter approach:**
- REST client adapter making API calls to Codex Cloud endpoints
- Maps webhook events into `RuntimeEvent` stream
- Background task polling for status updates when webhooks aren't configured
- The same `CodraRuntime` trait works — the adapter translates HTTP responses into runtime types

```
Codex Cloud                    CodraRuntime
──────────                     ─────────────
POST /codex/tasks    ──────▶  submit_task()
GET /codex/tasks/:id ──────▶  get_task()
POST /codex/tasks/:id/cancel ─ cancel_task()
Webhook callback     ──────▶  mapped to RuntimeEvent
```

### 3. Cursor SDK → `LocalAgent` Runtime

Cursor has a local agent with its own loop. The adapter would:
- Spawn the Cursor agent as a sidecar or embedded process
- Map Cursor's tool call schema into Codra's `ActionKind`
- Map Cursor's approval pattern into `PendingAction`

### 4. Claude Code / OpenCode / Gemini / Pi / Hermes → `CliAgent` Runtime

These are CLI tools. The adapter:
- Spawns the tool as a subprocess
- Intercepts stdout/stderr (structured output if supported, regex-parsed otherwise)
- Maps CLI output to `RuntimeEvent` stream
- May use pseudo-terminals (PTY) for interactive approval workflows
- Each CLI adapter has a `parse_output()` implementation specific to that tool's output format

### 5. Local Models (Ollama, LM Studio) → `LocalModel` Runtime

Uses Codra's own Planner-Executor-Verifier cycle with the `IntelligenceProvider` trait:
- The `LocalModel` runtime adapter wraps an `IntelligenceProvider` internally
- Runs Codra's existing `TaskPlanner`, `TaskExecutor`, `TaskVerifier` (from codra-core)
- The existing provider factory (`create_provider`) plugs directly into this adapter
- No external runtime — Codra is the runtime

---

## Safety Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                    SAFETY LAYER                           │
│                                                           │
│  All runtime actions pass through this layer before       │
│  reaching the filesystem, shell, or network.              │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. Workspace Permissions                           │  │
│  │     - All file reads/writes confined to workspace   │  │
│  │     - Path traversal detection                      │  │
│  │     - .codra directory is internal — never touched  │  │
│  │     - Configurable allowed/blocked path globs       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  2. Approval-First Execution                        │  │
│  │     - Every ActionKind has a default policy:        │  │
│  │       • ReadFile, Search → auto (no approval)       │  │
│  │       • WriteFile, EditFile → require approval      │  │
│  │       • RunCommand, InstallDependency → require     │  │
│  │       • Deploy, ComputerUse → require + risk warn   │  │
│  │     - PendingAction blocks execution until approved │  │
│  │     - Policies are configurable per-action          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  3. Command Allow/Deny Rules                        │  │
│  │     - Glob-based allowlist: only these commands     │  │
│  │     - Glob-based denylist: these are always blocked │  │
│  │     - Built-in dangerous patterns from              │  │
│  │       codra-core's command_safety.rs:               │  │
│  │       • rm -rf  • sudo  • git push --force          │  │
│  │       • chmod  • curl pipe bash  • ...              │  │
│  │     - Configurable per-workspace or per-session     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  4. Environment Secret Protection                   │  │
│  │     - Protected keys (API_KEY, TOKEN, SECRET, PASS) │  │
│  │     - Commands containing protected env values in   │  │
│  │       args are blocked or redacted from logs        │  │
│  │     - Environment snapshot before/after each        │  │
│  │       command execution                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  5. Audit Trail                                     │  │
│  │     - Every decision (auto-approve, denied,         │  │
│  │       user-approved, user-rejected) is logged       │  │
│  │     - All file changes are backed up before apply   │  │
│  │     - Full command history with exit codes          │  │
│  │     - Event stream = immutable audit log            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Safety Configuration Schema

```rust
pub struct SafetyConfig {
    /// Glob patterns for allowed workspace subdirectories.
    pub allowed_workspace_paths: Vec<String>,
    /// Glob patterns for blocked paths (inside workspace).
    pub blocked_workspace_paths: Vec<String>,

    /// Glob patterns for allowed commands.
    pub allowed_commands: Vec<String>,
    /// Glob patterns for denied commands.
    pub denied_commands: Vec<String>,

    /// Action kinds that require explicit user approval.
    pub require_approval: HashSet<ActionKind>,

    /// Environment variable keys (case-insensitive prefix match)
    /// that should be protected from exposure.
    pub protected_env_keys: Vec<String>,

    /// Maximum parallel tasks.
    pub max_concurrent_tasks: usize,
}
```

---

## Runtime Registry

```rust
/// Global registry of available runtime adapters.
pub struct RuntimeRegistry {
    adapters: HashMap<String, Box<dyn RuntimeFactory>>,
}

pub trait RuntimeFactory: Send + Sync {
    fn name(&self) -> &str;
    fn category(&self) -> RuntimeCategory;
    fn create(&self, config: RuntimeConfig) -> Result<Box<dyn CodraRuntime>, RuntimeError>;
    fn capabilities(&self) -> RuntimeCapabilities;
}

impl RuntimeRegistry {
    pub fn new() -> Self;
    pub fn register(&mut self, id: &str, factory: Box<dyn RuntimeFactory>);
    pub fn get(&self, id: &str) -> Option<&dyn RuntimeFactory>;
    pub fn list(&self) -> Vec<RuntimeFactoryInfo>;
    pub fn list_by_category(&self, category: RuntimeCategory) -> Vec<RuntimeFactoryInfo>;
}

pub struct RuntimeFactoryInfo {
    pub id: String,
    pub name: String,
    pub category: RuntimeCategory,
    pub capabilities: RuntimeCapabilities,
}
```

---

## Architecture Diagram (Proposed)

```
                      ┌──────────────────────────────────────┐
                      │         COBRA RUNTIME LAYER           │
                      │                                      │
                      │  ┌────────────────────────────────┐  │
                      │  │      RuntimeRegistry            │  │
                      │  │  id → RuntimeFactory            │  │
                      │  └─────────┬──────────────────────┘  │
                      │            │                         │
                      │  ┌─────────▼──────────────────────┐  │
                      │  │       CodraRuntime (trait)      │  │
                      │  │  create/resume/fork/clone       │  │
                      │  │  submit/approve/reject          │  │
                      │  │  subscribe/get_events            │  │
                      │  └────┬──────┬──────┬──────┬──────┘  │
                      │       │      │      │      │         │
                      │  ┌────▼──┐ ┌─▼───┐ ┌▼───┐ ┌▼────┐  │
                      │  │Local  │ │CLI  │ │Cloud│ │Model│  │
                      │  │Agent  │ │Agent│ │Agent│ │     │  │
                      │  │Codex, │ │Claude│ │Codex│ │Local│  │
                      │  │Cursor │ │Code, │ │Cloud│ │Direct│  │
                      │  │       │ │Pi,..│ │     │ │     │  │
                      │  └───────┘ └─────┘ └─────┘ └─────┘  │
                      └──────────────────────────────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
         ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐
         │  Desktop    │      │  CLI/TUI   │      │  Daemon    │
         │  (Tauri)    │      │  (codra)   │      │  (HTTP/SSE)│
         │             │      │            │      │            │
         │ Runtime     │      │ Terminal   │      │ REST API   │
         │ Picker      │      │ Event View │      │ Remote Ctrl│
         │ Event View  │      │            │      │            │
         └─────────────┘      └────────────┘      └────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │ Telegram   │  │ Android   │  │ Future    │
              │ Bot        │  │ App       │  │ Control   │
              │ (approval, │  │ (approval,│  │ Layers    │
              │  status)   │  │  status)  │  │           │
              └───────────┘  └───────────┘  └───────────┘
```

---

## MVP Implementation Slices

### Slice 1: Runtime Interface + Types (crates/codra-runtime)

**What:** Define `CodraRuntime` trait, all types, `RuntimeRegistry`, `SafetyConfig`.

**Files to create:**
- `crates/codra-runtime/Cargo.toml`
- `crates/codra-runtime/src/lib.rs` — re-exports
- `crates/codra-runtime/src/types.rs` — all data types (ported from this doc)
- `crates/codra-runtime/src/traits.rs` — `CodraRuntime`, `RuntimeFactory`, `EventReceiver`
- `crates/codra-runtime/src/registry.rs` — `RuntimeRegistry`
- `crates/codra-runtime/src/safety.rs` — `SafetyConfig`, `SafetyDecision`, `SafetyEnforcer` trait
- `crates/codra-runtime/src/error.rs` — `RuntimeError` enum

**Dependencies:** `serde`, `serde_json`, `uuid`, `chrono`, `thiserror`

**That compiles without any runtime adapter implementations.**

### Slice 2: Codex SDK Adapter Spike (crates/codra-runtime-codex)

**What:** Minimal `CodraRuntime` implementation that delegates to the OpenAI Codex SDK.

**Choice point:** FFI or sidecar process?
- **Recommended: sidecar** — the Codex SDK is Python/Node.js, and Rust FFI would be fragile. A sidecar process communicating over JSON-RPC or a simple stdio protocol keeps the boundary clean.
- The sidecar is a thin shim: start with `codra-runtime-<name>`, accept JSON commands on stdin, emit JSON events on stdout.

**Files to create:**
- `crates/codra-runtime-codex/Cargo.toml`
- `crates/codra-runtime-codex/src/lib.rs` — `CodexRuntime` struct implementing `CodraRuntime`
- `crates/codra-runtime-codex/src/sidecar.rs` — process management, JSON-RPC stdio protocol
- `crates/codra-runtime-codex/src/mapping.rs` — map Codex SDK types ↔ Codra runtime types

**Sidecar protocol:**

```
→ {"method":"init","params":{"apiKey":"...","workspacePath":"..."}}
← {"type":"status","connected":true}

→ {"method":"submit_task","params":{"sessionId":"...","prompt":"..."}}
← {"type":"task_created","taskId":"..."}
← {"type":"event","kind":"TaskPlanning","payload":{...}}
← {"type":"event","kind":"TaskActionPending","payload":{"actionId":"...",...}}

→ {"method":"approve_action","params":{"sessionId":"...","actionId":"..."}}
← {"type":"event","kind":"TaskActionApproved","payload":{...}}
```

### Slice 3: CLI/TUI Event Stream (crates/codra-cli enhanced)

**What:** Extend `codra-cli` to support:
- `codra session start` — start a session with a chosen runtime
- `codra session list` — list active sessions
- `codra session attach <id>` — live event stream in terminal
- `codra session approve/reject <action-id>` — approve from terminal
- Subscribe to runtime events and render as structured terminal output

**Files to modify:**
- `crates/codra-cli/Cargo.toml` — add `codra-runtime` dep
- `crates/codra-cli/src/main.rs` — add session/attach subcommands

**Requires:** Slice 1 + at least one adapter to test against.

### Slice 4: Desktop Runtime Picker Integration (apps/desktop)

**What:** Wire the desktop's ModelPicker and provider selection into the runtime registry.

**Files to modify:**
- `apps/desktop/src/lib/modelConfig.ts` — evolve `Provider`/`ModelConfig` to reference runtime IDs
- `apps/desktop/src/components/ModelPicker.tsx` — display runtime status (connected, capabilities)
- `apps/desktop/src/lib/codraTaskApi.ts` — add `createSession`, `subscribeToEvents` Tauri commands
- `apps/desktop/src-tauri/src/lib.rs` — add `runtime_registry` to AppState, expose `list_runtimes`, `create_session`, `subscribe_runtime_events` commands

**Requires:** Slice 1 + Slice 2 (to have at least one functional runtime).

### Slice 5 (Future): Telegram/Android Control Layer

**What:** A lightweight approval/status surface over the daemon's API or over a direct runtime adapter connection.

**Telegram bot:**
- `/sessions` — list active sessions
- `/approve <id>` — approve pending action
- `/reject <id> <reason>` — reject pending action
- `/status <session>` — get session summary

**Android:**
- PWA or native app wrapping the daemon API
- Push notifications for pending approval requests
- Quick approve/reject from notification

---

## Session Lifecycle (resume/fork/clone/handoff)

```
         ┌─────────────────────────────────────────┐
         │            SESSION LIFECYCLE              │
         │                                           │
         │  create_session()                         │
         │       │                                   │
         │       ▼                                   │
         │  ┌──────────┐                             │
         │  │  Active   │ ◀───── resume_session()   │
         │  └────┬─────┘                             │
         │       │                                   │
         │       ├──────────────────────────┐        │
         │       ▼                          ▼        │
         │  ┌──────────┐            ┌──────────┐     │
         │  │ Paused   │            │Completed │     │
         │  └────┬─────┘            └──────────┘     │
         │       │ resume                            │
         │       └──────▶ Active                     │
         │                                           │
         │  fork_session()  ───────▶ New Active      │
         │  clone_session() ───────▶ New Active      │
         │  handoff_session(target) ───▶ HandedOff   │
         │  cancel_session() ───────▶ Cancelled      │
         └─────────────────────────────────────────┘
```

**Fork vs Clone:**
- **Fork:** Creates a new independent session from a point in time, but with an optional new prompt. The original session continues unaffected. Use case: exploring alternative approaches.
- **Clone:** Creates a byte-for-byte copy of session state with a new ID. Use case: preparing a session for handoff to another runtime.
- **Handoff:** Pauses the current runtime's session, clones state to the target runtime, activates it there. The original becomes `HandedOff`. Use case: switching from Codex SDK to Claude Code after the SDK reaches its limit.

---

## Codex SDK → Codra Runtime Mapping Detail

| Codex SDK Concept | Codra Runtime Concept | Notes |
|---|---|---|
| `Codex(api_key=...)` | `RuntimeFactory::create(config)` | Initialization |
| `Codex.with_tools(...)` | `RuntimeConfig.safety_config` | Tool mapping during init |
| `codex.run(prompt, workspace)` | `submit_task(session_id, prompt)` | Task submission |
| `AgentRun` | `TaskHandle` | Run handle |
| `AgentEvent.kind` | `EventKind` | Event type mapping |
| `on_approval(pending)` callback | `subscribe()` → `RuntimeEvent(ActionPending)` | Approval interception |
| `pending.approve()` | `approve_action(session_id, action_id)` | Approval |
| `pending.reject(reason)` | `reject_action(session_id, action_id, reason)` | Rejection |
| `AgentRun.cancel()` | `cancel_task(session_id, task_id)` | Cancellation |
| `AgentEvent.text` | `RuntimeEvent.payload["message"]` | Log/status text |
| `ToolResult` | `CompletedAction` | Tool execution result |
| `token_usage` | `RuntimeCapabilities.model_info` | Model stats |

**Status:**
- Codex SDK already provides: agent loop, tool use, approval, events, sessions
- The adapter is primarily a structural mapping layer
- No need to re-implement planning/execution/verification — Codex SDK does it natively
- This is the simplest adapter to implement and validates the entire `CodraRuntime` interface

---

## Codex Cloud → Future Codra Cloud Mapping

| Codex Cloud API | Codra Runtime Concept | Planned Codra Cloud |
|---|---|---|
| `POST /codex/tasks` | `submit_task()` | `POST /codra-cloud/tasks` |
| `GET /codex/tasks/:id` | `get_task()` | `GET /codra-cloud/tasks/:id` |
| Webhook events | `subscribe()` → `RuntimeEvent` | WebSocket/SSE endpoint |
| `POST /codex/tasks/:id/cancel` | `cancel_task()` | `POST /codra-cloud/tasks/:id/cancel` |
| Org/project management | `RuntimeConfig.metadata` | `POST /codra-cloud/sessions` |
| Usage quotas | `RuntimeCapabilities` | Quota endpoints |
| Background execution | Non-blocking `submit_task()` | Async task processing |

**Codra Cloud would implement the `CloudAgent` runtime category:**
- Same `CodraRuntime` trait — no new interface needed
- The daemon or a dedicated cloud runtime adapter would translate Codra REST calls to Codra Cloud API calls
- Clients don't need to know whether a runtime is local or cloud — they use the same trait

---

## Risks & Blockers

### High

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Codex SDK availability** | OpenAI Codex SDK may require API keys, have rate limits, or be in limited beta. If unavailable, the adapter cannot be tested. | Build the interface and a mock Codex sidecar for testing. Switch to a different first adapter (Local/Ollama) if needed. |
| **CLI adapter reliability** | CLI tools (Claude Code, OpenCode) emit unstructured output. Parsing is fragile. | Structured output mode (JSON/event-stream) should be the first integration target. Regex fallback as last resort. |
| **Sidecar process management** | Sidecar processes can leak, crash, or deadlock. | Use `tokio::process::Command` with proper lifecycle tracking. Heartbeat pings. Automatic restart with session recovery. |
| **Session state portability** | Different runtimes have different session representations. Fork/clone/handoff requires a canonical serialization format. | Define `SessionContext` as the canonical serialization format. Each adapter implements `export_state()` and `import_state()`. |

### Medium

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Performance** | Sidecar communication over stdio/sockets adds latency vs in-process calls. | Buffer events, batch where possible. Profile before optimizing. |
| **Approval race conditions** | User approves an action while runtime is already executing the next step. | Lock-step approval: runtime must pause on pending actions, wait for approval/rejection signal. |
| **Event volume** | High-frequency streaming events (model tokens, tool output) could overwhelm consumers. | Configurable event throttling. Client-side buffering. Backpressure via `EventReceiver`. |
| **Cross-platform CLI paths** | CLI tools have different install paths on Linux, macOS, Windows. | Runtime factory probes known paths, `which`, environment variables. Configurable override. |

### Low

| Risk | Description | Mitigation |
|------|-------------|------------|
| **API key propagation** | Multiple runtimes may need different API keys, stored in different places. | Unified `RuntimeConfig.api_key` + runtime-specific `extra` map. Providers handle key wrapping. |
| **Backward compatibility** | Existing codra-core types (Task, TaskStatus, TaskEvent) duplicate runtime types. | Runtime types live in `codra-runtime`. Legacy codra-core types become one implementation (LocalModel runtime). Migration path: adapters map to legacy types where needed. |
| **Feature disparity** | Not all runtimes support all capabilities (fork, clone, streaming). | `RuntimeCapabilities` struct lets consumers check before calling. Graceful fallback. |

---

## Future: Computer-Use & Sandbox Runtimes

### Design Principle: Code First, Computer-Use Later

Codra's architecture treats **code runtimes** (Planner→Executor→Verifier, file edits, shell commands, git) as the primary execution path and **computer-use runtimes** (GUI automation, browser observation, screen interaction) as a future extension. This priority ladder guides all implementation choices:

```
Priority 1: Code runtimes (LocalAgent, CliAgent, CloudAgent, DirectModel, LocalModel)
Priority 2: Computer-use runtimes (ComputerUseAgent — see Cua architecture)
Priority 3: Sandbox runtimes (SandboxAgent — isolated execution environments)
Priority 4: Mobile device runtimes (MobileDeviceAgent — emulator/ADB control)
```

### What a Computer-Use Runtime Does

A `ComputerUseAgent` runtime can:
- **Observe screen state** — capture full-screen, window, or region screenshots; read pixel data
- **Interact with GUI** — click, drag, scroll, type, press keys at OS level
- **Run shell commands** — within the sandbox environment (not the host)
- **Control browsers** — navigate, click elements, extract text via CDP or Playwright-style APIs
- **Verify UI outcomes** — compare screenshots against expected state, detect visual regressions
- **Record trajectories** — every action + resulting screenshot + model thought for replay

Key difference from code runtimes: a computer-use runtime operates on **visual state**, not just file/process state. The agent must interpret pixels, not just text.

### What a Sandbox Runtime Does

A `SandboxAgent` runtime wraps another runtime in an isolated environment:
- **Container isolation** (Docker/Podman) for Linux, **VM isolation** for cross-platform safety
- **No host filesystem access** — workspace is copied into the sandbox; results are extracted
- **Network policy** — can be restricted (no internet), bridged (limited ports), or open
- **Resource limits** — CPU, memory, disk, network bandwidth caps
- **Ephemeral by default** — containers destroyed after task completion unless snapshot is saved
- **Snapshot/resume** — save sandbox state mid-task for debugging or replay

Sandboxes are the natural host for `ComputerUseAgent` runtimes, since GUI automation requires elevated OS access that shouldn't run directly on the user's machine.

### Capability Flags

The `RuntimeCapabilities` struct (defined above) includes six computer-use/sandbox flags:

| Flag | Meaning | Example Runtimes |
|------|---------|-----------------|
| `supports_gui_control` | Can click, type, drag at OS level | Cua sandbox, WinAppDriver, Xvfb + xdotool |
| `supports_screenshot` | Can capture screen as image | Chromium CDP, Xvfb + ImageMagick, Windows GDI |
| `supports_replay` | Can record + replay task trajectories | Cua sandbox (step replay), Browserstack sessions |
| `supports_sandbox` | Runs in isolated container/VM | Docker executor, Firecracker microVM, QEMU |
| `supports_browser` | Can launch and control browser | Chromium CDP, Playwright, Selenium |
| `supports_mobile_device` | Controls emulator or physical device | Android ADB, iOS simulator, Browserstack device cloud |

### Runtime Categories for Computer-Use & Sandbox

```rust
pub enum RuntimeCategory {
    // Existing:
    LocalAgent,
    CliAgent,
    CloudAgent,
    DirectModel,
    LocalModel,

    // New:
    /// Computer-use agent — observes and interacts with a GUI environment.
    /// Can be hosted inside a sandbox for isolation.
    ComputerUseAgent,

    /// Sandboxed agent — wraps any runtime in an isolated container/VM.
    /// The sandbox provides filesystem, network, and resource isolation.
    /// Often paired with a ComputerUseAgent inside the sandbox.
    SandboxAgent,
}
```

### Task Traces: Commands, Diffs, Approvals, Screenshots, Trajectories

Codra task traces should evolve to include computer-use and sandbox artifacts:

```rust
pub struct ComputerUseStep {
    pub step_index: u32,
    pub action: ComputerUseAction,         // what the agent did
    pub screenshot_before: Option<String>,  // base64 PNG before action
    pub screenshot_after: Option<String>,   // base64 PNG after action
    pub dom_snapshot: Option<String>,       // accessibility tree / DOM
    pub model_thought: Option<String>,      // what the model was thinking
    pub action_result: String,              // success/failure/error
    pub timestamp: String,
}

pub struct TaskTrace {
    pub task_id: String,
    pub session_id: String,
    pub runtime_category: RuntimeCategory,

    // Code runtime artifacts:
    pub commands_run: Vec<CommandRunRecord>,
    pub file_changes: Vec<FileChangeRecord>,
    pub approvals: Vec<ApprovalRecord>,

    // Computer-use artifacts (when applicable):
    pub computer_use_steps: Option<Vec<ComputerUseStep>>,

    // Sandbox artifacts (when applicable):
    pub sandbox_id: Option<String>,
    pub sandbox_snapshot_path: Option<String>,

    // Replay metadata:
    pub total_steps: u32,
    pub supports_replay: bool,
    pub replay_format: Option<String>,  // "cua_trajectory_v1", "codra_trace_v1"
}
```

### Architecture: How Computer-Use & Sandbox Fit Into Each Surface

#### Codra Desktop

- **Runtime picker** shows computer-use and sandbox runtimes alongside code runtimes
- **Session pane** displays screenshots inline (before/after each action)
- **Replay viewer** lets users step through task trajectories frame-by-frame
- **Sandbox indicator** shows resource usage, isolation status, network policy
- Desktop itself never hosts a computer-use runtime — it connects to remote sandboxes

#### Codra CLI/TUI

- `codra sandbox create` — provision a sandbox (local Docker or remote worker)
- `codra sandbox attach <id>` — stream events from sandbox runtime
- `codra sandbox exec <id> "command"` — run commands inside sandbox
- `codra replay <task-id>` — step through a recorded trajectory
- `codra screenshot <task-id> <step>` — view screenshot at a specific step

#### Codra Daemon

- REST endpoints for sandbox lifecycle: `POST /api/sandboxes`, `DELETE /api/sandboxes/:id`
- REST endpoints for replay: `GET /api/tasks/:id/trajectory`, `GET /api/tasks/:id/replay`
- SSE streams include screenshot metadata alongside events
- Acts as gateway: desktops/CLIs talk to daemon, daemon talks to sandbox workers

#### Android/Telegram Control Layer

- Receive screenshot thumbnails in approval notifications
- Approve/reject GUI actions (click here, type this) from phone
- View task replay as a slideshow of screenshots
- Remotely start/stop sandbox runtimes

#### Codex SDK Runtime

- Codex SDK's `computer_use` tools map to `ComputerUseActionKind` (ClickTarget, TypeText, PressKey)
- Codex SDK's screenshot capabilities map to `ComputerUseStep.screenshot_*`
- The same `CodraRuntime` trait works — just with additional capability flags set

#### Claude Code / OpenCode / Pi / Hermes Runtimes

- These CLI tools don't support computer-use natively
- When used through Codra, the CLI adapter treats them as code-only (`supports_gui_control: false`)
- Users can still route their tasks into a sandbox that happens to use a different runtime

#### Future Cua-like Sandbox Runtime

A `ComputerUseAgent` runtime modeled after Cua's architecture would:

```
┌───────────────────────────────────────────────┐
│           CuaSandboxRuntime                     │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. Provision container                  │   │
│  │    - Docker / Firecracker / QEMU        │   │
│  │    - Mount workspace copy               │   │
│  │    - Configure network policy           │   │
│  │    - Set resource limits                │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 2. Start Xvfb + window manager          │   │
│  │    - Virtual framebuffer (Xvfb)         │   │
│  │    - Lightweight WM (fluxbox, jwm)     │   │
│  │    - VNC or pipe screenshot stream      │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 3. Agent loop inside container           │   │
│  │    - LLM → thought → action → observe   │   │
│  │    - Actions: click, type, shell, wait  │   │
│  │    - Observation: screenshot + a11y tree│   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 4. Stream events + screenshots back     │   │
│  │    - Every step: screenshot + action    │   │
│  │    - Approval requests for risky ops    │   │
│  │    - On container exit: collect results │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 5. Return artifacts                     │   │
│  │    - TaskTrace with trajectory          │   │
│  │    - Screenshots at each step           │   │
│  │    - File diffs (if workspace modified) │   │
│  │    - Replay-ready trajectory JSON       │   │
│  └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

The `ComputerUseAgent` and `SandboxAgent` runtime categories are **additive** to the existing architecture:
- They don't change the `CodraRuntime` trait — the same `submit_task`, `approve`, `stream_events` interface works
- They add new capability flags so consumers can decide what UI to show
- They introduce new data types (`ComputerUseStep`, `TaskTrace`) for task artifacts
- They enable one runtime to host another (`SandboxAgent` contains a `ComputerUseAgent`)

### Planning vs. Computer-Use Priority

```
Current (MVP):
  Code runtimes only
  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
  │LLA  │ │CLI  │ │Cloud│ │Model│
  └─────┘ └─────┘ └─────┘ └─────┘

Phase 2:
  + Computer-use runtime (remote sandbox only)
  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────────┐
  │Code │ │CLI  │ │Cloud│ │Model│ │CuaSandbox│
  └─────┘ └─────┘ └─────┘ └─────┘ └──────────┘
                                      │
                                 ┌────▼────┐
                                 │ Worker   │
                                 │ (remote) │
                                 └─────────┘

Phase 3:
  + Local sandbox (for offline/low-risk computer-use)
  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────────┐ ┌────────────┐
  │Code │ │CLI  │ │Cloud│ │Model│ │CuaSandbox│ │LocalSandbox│
  └─────┘ └─────┘ └─────┘ └─────┘ └──────────┘ └────────────┘

Phase 4:
  + Mobile device runtime
  + Cross-runtime task handoff (code → sandbox → mobile)
  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐
  │Code │ │CLI  │ │Cloud│ │Model│ │CuaSandbox│ │LocalSandbox│ │MobileDev │
  └─────┘ └─────┘ └─────┘ └─────┘ └──────────┘ └────────────┘ └──────────┘
```
