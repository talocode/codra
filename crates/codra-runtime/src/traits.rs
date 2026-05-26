use std::pin::Pin;

use crate::error::RuntimeResult;
use crate::types::{
    CloneSessionRequest, CreateSessionRequest, ForkSessionRequest, HandoffSessionRequest,
    ResumeSessionRequest, RuntimeApprovalDecision, RuntimeCapabilities, RuntimeEvent,
    RuntimeHealth, RuntimeId, RuntimeKind, RuntimeSession, RuntimeSessionId, RuntimeTask,
    RuntimeTaskId, SafetyConfig, SubmitTaskRequest,
};
use async_trait::async_trait;
use futures::Stream;

/// A pinned, boxed, sendable stream of runtime events.
///
/// Concrete implementations are provided by each runtime adapter
/// in later slices.
pub type EventStream = Pin<Box<dyn Stream<Item = RuntimeEvent> + Send>>;

/// The core trait that every runtime adapter implements.
///
/// A "runtime" is any system that can execute agent tasks:
/// local SDKs, CLI tools, cloud services, or direct model endpoints.
#[async_trait]
pub trait CodraRuntime: Send + Sync {
    // ── Identity ────────────────────────────────────────────────

    /// Unique identifier for this runtime instance.
    fn id(&self) -> &RuntimeId;

    /// Human-readable name (e.g. "Codex SDK Agent", "Stub Runtime").
    fn name(&self) -> &str;

    /// The runtime category.
    fn kind(&self) -> RuntimeKind;

    /// What this runtime supports (sessions, resume, fork, clone,
    /// handoff, approval, streaming, planning, verification, repair).
    fn capabilities(&self) -> RuntimeCapabilities;

    // ── Lifecycle ───────────────────────────────────────────────

    /// Current health status.
    async fn health(&self) -> RuntimeHealth;

    /// Initialize the runtime (connect, authenticate, set up workspace).
    async fn initialize(&self, safety_config: SafetyConfig) -> RuntimeResult<()>;

    /// Clean shutdown.
    async fn shutdown(&self) -> RuntimeResult<()>;

    // ── Session Management ──────────────────────────────────────

    /// Create a new session with a user prompt and workspace context.
    async fn create_session(&self, request: CreateSessionRequest) -> RuntimeResult<RuntimeSession>;

    /// Resume a previously paused/saved session.
    async fn resume_session(&self, request: ResumeSessionRequest) -> RuntimeResult<RuntimeSession>;

    /// Fork an existing session into a new independent session.
    async fn fork_session(&self, request: ForkSessionRequest) -> RuntimeResult<RuntimeSession>;

    /// Clone a session (same state, new ID — for handoff).
    async fn clone_session(&self, request: CloneSessionRequest) -> RuntimeResult<RuntimeSession>;

    /// Handoff a session to another runtime.
    async fn handoff_session(&self, request: HandoffSessionRequest) -> RuntimeResult<()>;

    // ── Task Execution ──────────────────────────────────────────

    /// Submit a task for execution within a session.
    async fn submit_task(&self, request: SubmitTaskRequest) -> RuntimeResult<RuntimeTask>;

    /// Approve or reject a pending action.
    async fn approve(&self, decision: RuntimeApprovalDecision) -> RuntimeResult<()>;

    /// Cancel a running task.
    async fn cancel_task(
        &self,
        session_id: RuntimeSessionId,
        task_id: RuntimeTaskId,
    ) -> RuntimeResult<()>;

    // ── Event Streaming ─────────────────────────────────────────

    /// Subscribe to events from a session.
    /// Returns a pinned, boxed, sendable stream of RuntimeEvent items.
    async fn stream_events(&self, session_id: RuntimeSessionId) -> RuntimeResult<EventStream>;
}
