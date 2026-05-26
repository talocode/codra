use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ── Identifiers ─────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RuntimeId(pub String);

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RuntimeSessionId(pub String);

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RuntimeTaskId(pub String);

// ── Runtime Metadata ─────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuntimeKind {
    #[serde(rename = "local_agent")]
    LocalAgent,
    #[serde(rename = "cli_agent")]
    CliAgent,
    #[serde(rename = "cloud_agent")]
    CloudAgent,
    #[serde(rename = "direct_model")]
    DirectModel,
    #[serde(rename = "local_model")]
    LocalModel,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuntimeStatus {
    #[serde(rename = "uninitialized")]
    Uninitialized,
    #[serde(rename = "initializing")]
    Initializing,
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "degraded")]
    Degraded,
    #[serde(rename = "shutting_down")]
    ShuttingDown,
    #[serde(rename = "shutdown")]
    Shutdown,
    #[serde(rename = "error")]
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
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
    pub max_concurrent_sessions: usize,
    pub available_tools: Vec<String>,
    pub streaming: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeHealth {
    pub connected: bool,
    pub ready: bool,
    pub version: Option<String>,
    pub authenticated: bool,
    pub status: RuntimeStatus,
}

// ── Session Types ────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SessionStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "awaiting_approval")]
    AwaitingApproval,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "handed_off")]
    HandedOff,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeSession {
    pub session_id: RuntimeSessionId,
    pub runtime_id: RuntimeId,
    pub runtime_name: String,
    pub workspace_path: String,
    pub status: SessionStatus,
    pub created_at: String,
    pub updated_at: String,
    pub active_task: Option<RuntimeTaskId>,
    pub event_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSessionRequest {
    pub workspace_path: String,
    pub user_prompt: String,
    pub initial_context: Option<SessionContext>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionContext {
    pub open_files: Vec<String>,
    pub git_branch: Option<String>,
    pub recent_commands: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResumeSessionRequest {
    pub session_id: RuntimeSessionId,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForkSessionRequest {
    pub session_id: RuntimeSessionId,
    pub new_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloneSessionRequest {
    pub session_id: RuntimeSessionId,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandoffSessionRequest {
    pub session_id: RuntimeSessionId,
    pub target_runtime_id: RuntimeId,
}

// ── Task Types ───────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuntimeTaskStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "planning")]
    Planning,
    #[serde(rename = "awaiting_approval")]
    AwaitingApproval,
    #[serde(rename = "approved")]
    Approved,
    #[serde(rename = "executing")]
    Executing,
    #[serde(rename = "verifying")]
    Verifying,
    #[serde(rename = "repairing")]
    Repairing,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeTask {
    pub task_id: RuntimeTaskId,
    pub session_id: RuntimeSessionId,
    pub status: RuntimeTaskStatus,
    pub prompt: String,
    pub created_at: String,
    pub updated_at: String,
    pub result: Option<TaskResult>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitTaskRequest {
    pub session_id: RuntimeSessionId,
    pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub success: bool,
    pub summary: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeApprovalRequest {
    pub id: String,
    pub session_id: RuntimeSessionId,
    pub task_id: RuntimeTaskId,
    pub kind: ActionKind,
    pub description: String,
    pub details: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeApprovalDecision {
    pub request_id: String,
    pub approved: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ActionKind {
    #[serde(rename = "read_file")]
    ReadFile,
    #[serde(rename = "write_file")]
    WriteFile,
    #[serde(rename = "edit_file")]
    EditFile,
    #[serde(rename = "run_command")]
    RunCommand,
    #[serde(rename = "search")]
    Search,
    #[serde(rename = "git_operation")]
    GitOperation,
    #[serde(rename = "browser_action")]
    BrowserAction,
    #[serde(rename = "computer_use")]
    ComputerUse,
    #[serde(rename = "network_request")]
    NetworkRequest,
    #[serde(rename = "install_dependency")]
    InstallDependency,
    #[serde(rename = "deploy")]
    Deploy,
}

// ── Event Types ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeEvent {
    pub id: String,
    pub timestamp: String,
    pub session_id: RuntimeSessionId,
    pub task_id: Option<RuntimeTaskId>,
    pub kind: RuntimeEventKind,
    pub source: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuntimeEventKind {
    #[serde(rename = "session_created")]
    SessionCreated,
    #[serde(rename = "session_resumed")]
    SessionResumed,
    #[serde(rename = "session_paused")]
    SessionPaused,
    #[serde(rename = "session_cancelled")]
    SessionCancelled,
    #[serde(rename = "session_handed_off")]
    SessionHandedOff,

    #[serde(rename = "task_created")]
    TaskCreated,
    #[serde(rename = "task_planning")]
    TaskPlanning,
    #[serde(rename = "task_plan_ready")]
    TaskPlanReady,
    #[serde(rename = "task_awaiting_approval")]
    TaskAwaitingApproval,
    #[serde(rename = "task_approved")]
    TaskApproved,
    #[serde(rename = "task_rejected")]
    TaskRejected,
    #[serde(rename = "task_executing")]
    TaskExecuting,
    #[serde(rename = "task_action_pending")]
    TaskActionPending,
    #[serde(rename = "task_action_approved")]
    TaskActionApproved,
    #[serde(rename = "task_action_rejected")]
    TaskActionRejected,
    #[serde(rename = "task_verifying")]
    TaskVerifying,
    #[serde(rename = "task_repairing")]
    TaskRepairing,
    #[serde(rename = "task_completed")]
    TaskCompleted,
    #[serde(rename = "task_failed")]
    TaskFailed,
    #[serde(rename = "task_cancelled")]
    TaskCancelled,
    #[serde(rename = "task_log")]
    TaskLog,

    #[serde(rename = "runtime_log")]
    RuntimeLog,
    #[serde(rename = "runtime_error")]
    RuntimeError,
    #[serde(rename = "runtime_disconnected")]
    RuntimeDisconnected,
    #[serde(rename = "runtime_reconnected")]
    RuntimeReconnected,

    #[serde(rename = "tool_call")]
    ToolCall,
    #[serde(rename = "tool_result")]
    ToolResult,
    #[serde(rename = "model_generation")]
    ModelGeneration,
    #[serde(rename = "model_stream_chunk")]
    ModelStreamChunk,

    #[serde(rename = "approval_requested")]
    ApprovalRequested,
    #[serde(rename = "approval_granted")]
    ApprovalGranted,
    #[serde(rename = "approval_denied")]
    ApprovalDenied,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeLogEvent {
    pub level: String,
    pub message: String,
    pub target: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimePlanEvent {
    pub summary: String,
    pub steps: Vec<PlanStep>,
    pub requires_approval: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStep {
    pub id: String,
    pub title: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeApprovalEvent {
    pub action_id: String,
    pub kind: ActionKind,
    pub description: String,
    pub details: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeToolEvent {
    pub tool_name: String,
    pub input: serde_json::Value,
    pub output: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeFileChangeEvent {
    pub path: String,
    pub change_type: String,
    pub diff: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeCommandEvent {
    pub command: String,
    pub exit_code: Option<i32>,
    pub stdout_preview: Option<String>,
    pub stderr_preview: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeResultEvent {
    pub success: bool,
    pub summary: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeErrorEvent {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

// ── Safety Types ─────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafetyConfig {
    pub allowed_workspace_paths: Vec<String>,
    pub blocked_workspace_paths: Vec<String>,
    pub allowed_commands: Vec<String>,
    pub denied_commands: Vec<String>,
    pub require_approval: Vec<ActionKind>,
    pub protected_env_keys: Vec<String>,
    pub max_concurrent_tasks: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspacePermission {
    pub workspace_path: String,
    pub allowed_subdirs: Vec<String>,
    pub blocked_subdirs: Vec<String>,
    pub read_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandPolicy {
    pub allowed_commands: Vec<String>,
    pub denied_commands: Vec<String>,
    pub require_approval: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretHandlingPolicy {
    pub protected_env_keys: Vec<String>,
    pub redact_in_logs: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalPolicy {
    pub require_approval_for: Vec<ActionKind>,
    pub auto_approve: Vec<ActionKind>,
    pub max_auto_approve_per_session: usize,
}

impl Default for SafetyConfig {
    fn default() -> Self {
        Self {
            allowed_workspace_paths: vec!["**".to_string()],
            blocked_workspace_paths: vec![],
            allowed_commands: vec![],
            denied_commands: vec![
                "rm -rf *".to_string(),
                "rm -rf /".to_string(),
                "sudo *".to_string(),
            ],
            require_approval: vec![
                ActionKind::WriteFile,
                ActionKind::EditFile,
                ActionKind::RunCommand,
                ActionKind::InstallDependency,
                ActionKind::Deploy,
            ],
            protected_env_keys: vec![
                "API_KEY".to_string(),
                "TOKEN".to_string(),
                "SECRET".to_string(),
                "PASSWORD".to_string(),
            ],
            max_concurrent_tasks: 1,
        }
    }
}
