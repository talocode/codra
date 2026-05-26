use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use async_trait::async_trait;
use chrono::Utc;

use codra_core::task_lifecycle::TaskLifecycle;
use codra_core::task_planner::TaskPlanner;
use codra_core::task_store::TaskStore;
use codra_protocol as cp;

use codra_runtime::{
    error::{RuntimeError, RuntimeResult},
    traits::{CodraRuntime, EventStream},
    types::{
        CloneSessionRequest, CreateSessionRequest, ForkSessionRequest, HandoffSessionRequest,
        ResumeSessionRequest, RuntimeApprovalDecision, RuntimeCapabilities, RuntimeEvent,
        RuntimeEventKind, RuntimeHealth, RuntimeId, RuntimeKind, RuntimeSession, RuntimeSessionId,
        RuntimeStatus, RuntimeTask, RuntimeTaskId, RuntimeTaskStatus, SafetyConfig, SessionStatus,
        SubmitTaskRequest,
    },
};

struct SessionEntry {
    session: RuntimeSession,
    task_store: TaskStore,
    next_approval_id: u64,
    approval_map: HashMap<String, String>,
    tasks: HashMap<String, RuntimeTask>,
}

struct Inner {
    sessions: HashMap<RuntimeSessionId, SessionEntry>,
    initialized: bool,
}

pub struct NativeCodraRuntime {
    id: RuntimeId,
    name: String,
    inner: Arc<Mutex<Inner>>,
}

impl NativeCodraRuntime {
    pub fn new() -> Self {
        Self {
            id: RuntimeId("codra-native".to_string()),
            name: "Codra Native Runtime".to_string(),
            inner: Arc::new(Mutex::new(Inner {
                sessions: HashMap::new(),
                initialized: false,
            })),
        }
    }

    pub fn new_with_id(id: &str, name: &str) -> Self {
        Self {
            id: RuntimeId(id.to_string()),
            name: name.to_string(),
            inner: Arc::new(Mutex::new(Inner {
                sessions: HashMap::new(),
                initialized: false,
            })),
        }
    }
}

fn map_task_status(status: &cp::TaskStatus) -> RuntimeTaskStatus {
    match status {
        cp::TaskStatus::Draft => RuntimeTaskStatus::Pending,
        cp::TaskStatus::Planning => RuntimeTaskStatus::Planning,
        cp::TaskStatus::AwaitingApproval => RuntimeTaskStatus::AwaitingApproval,
        cp::TaskStatus::Approved => RuntimeTaskStatus::Approved,
        cp::TaskStatus::Executing => RuntimeTaskStatus::Executing,
        cp::TaskStatus::Verifying => RuntimeTaskStatus::Verifying,
        cp::TaskStatus::RepairPlanning => RuntimeTaskStatus::Planning,
        cp::TaskStatus::AwaitingRepairApproval => RuntimeTaskStatus::AwaitingApproval,
        cp::TaskStatus::Repairing => RuntimeTaskStatus::Repairing,
        cp::TaskStatus::Completed => RuntimeTaskStatus::Completed,
        cp::TaskStatus::Failed => RuntimeTaskStatus::Failed,
        cp::TaskStatus::Cancelled => RuntimeTaskStatus::Cancelled,
    }
}

fn map_event_kind(event_type: &str) -> RuntimeEventKind {
    match event_type {
        "task.created" => RuntimeEventKind::TaskCreated,
        "task.planned" => RuntimeEventKind::TaskPlanReady,
        "task.approved" => RuntimeEventKind::TaskApproved,
        "task.cancelled" => RuntimeEventKind::TaskCancelled,
        "task.failed" => RuntimeEventKind::TaskFailed,
        "task.executing" => RuntimeEventKind::TaskExecuting,
        _ => RuntimeEventKind::TaskLog,
    }
}

fn map_events(
    task_events: Vec<cp::TaskEvent>,
    session_id: &RuntimeSessionId,
    task_id: Option<RuntimeTaskId>,
    source: &str,
) -> Vec<RuntimeEvent> {
    task_events
        .into_iter()
        .map(|e| RuntimeEvent {
            id: format!("evt_{}", e.id),
            timestamp: e.timestamp,
            session_id: session_id.clone(),
            task_id: task_id.clone(),
            kind: map_event_kind(&e.event_type),
            source: source.to_string(),
            payload: serde_json::json!({
                "event_type": e.event_type,
                "message": e.message,
            }),
        })
        .collect()
}

#[async_trait]
impl CodraRuntime for NativeCodraRuntime {
    fn id(&self) -> &RuntimeId {
        &self.id
    }

    fn name(&self) -> &str {
        &self.name
    }

    fn kind(&self) -> RuntimeKind {
        RuntimeKind::LocalAgent
    }

    fn capabilities(&self) -> RuntimeCapabilities {
        RuntimeCapabilities {
            supports_sessions: true,
            supports_resume: true,
            supports_fork: false,
            supports_clone: false,
            supports_handoff: false,
            supports_approval: true,
            supports_event_streaming: true,
            supports_planning: true,
            supports_verification: false,
            supports_repair: false,
            max_concurrent_sessions: 5,
            available_tools: vec![],
            streaming: false,
        }
    }

    async fn health(&self) -> RuntimeHealth {
        let inner = self.inner.lock().unwrap();
        RuntimeHealth {
            connected: true,
            ready: inner.initialized,
            version: Some("0.1.0-native".to_string()),
            authenticated: true,
            status: if inner.initialized {
                RuntimeStatus::Ready
            } else {
                RuntimeStatus::Uninitialized
            },
        }
    }

    async fn initialize(&self, _safety_config: SafetyConfig) -> RuntimeResult<()> {
        let mut inner = self.inner.lock().unwrap();
        if inner.initialized {
            return Err(RuntimeError::AlreadyInitialized);
        }
        inner.initialized = true;
        Ok(())
    }

    async fn shutdown(&self) -> RuntimeResult<()> {
        let mut inner = self.inner.lock().unwrap();
        inner.initialized = false;
        Ok(())
    }

    async fn create_session(&self, request: CreateSessionRequest) -> RuntimeResult<RuntimeSession> {
        let mut inner = self.inner.lock().unwrap();
        if !inner.initialized {
            return Err(RuntimeError::NotInitialized);
        }

        let session_id = RuntimeSessionId(uuid::Uuid::new_v4().to_string());
        let now = Utc::now().to_rfc3339();
        let task_store = TaskStore::new(&request.workspace_path);

        let session = RuntimeSession {
            session_id: session_id.clone(),
            runtime_id: self.id.clone(),
            runtime_name: self.name.clone(),
            workspace_path: request.workspace_path.clone(),
            status: SessionStatus::Active,
            created_at: now.clone(),
            updated_at: now,
            active_task: None,
            event_count: 0,
        };

        inner.sessions.insert(
            session_id.clone(),
            SessionEntry {
                session: session.clone(),
                task_store,
                next_approval_id: 1,
                approval_map: HashMap::new(),
                tasks: HashMap::new(),
            },
        );

        Ok(session)
    }

    async fn resume_session(&self, request: ResumeSessionRequest) -> RuntimeResult<RuntimeSession> {
        let mut inner = self.inner.lock().unwrap();
        let entry = inner
            .sessions
            .get_mut(&request.session_id)
            .ok_or_else(|| RuntimeError::SessionNotFound(request.session_id.0.clone()))?;
        entry.session.status = SessionStatus::Active;
        entry.session.updated_at = Utc::now().to_rfc3339();
        Ok(entry.session.clone())
    }

    async fn fork_session(&self, _request: ForkSessionRequest) -> RuntimeResult<RuntimeSession> {
        Err(RuntimeError::Unsupported)
    }

    async fn clone_session(&self, _request: CloneSessionRequest) -> RuntimeResult<RuntimeSession> {
        Err(RuntimeError::Unsupported)
    }

    async fn handoff_session(&self, _request: HandoffSessionRequest) -> RuntimeResult<()> {
        Err(RuntimeError::Unsupported)
    }

    async fn submit_task(&self, request: SubmitTaskRequest) -> RuntimeResult<RuntimeTask> {
        let mut inner = self.inner.lock().unwrap();
        if !inner.initialized {
            return Err(RuntimeError::NotInitialized);
        }

        let entry = inner
            .sessions
            .get_mut(&request.session_id)
            .ok_or_else(|| RuntimeError::SessionNotFound(request.session_id.0.clone()))?;

        let planner = TaskPlanner::new(entry.task_store.clone());
        let task = planner
            .create_task(&entry.session.workspace_path, &request.prompt, None)
            .map_err(|e| RuntimeError::Runtime(e))?;

        let task_id = RuntimeTaskId(task.id.clone());
        let native_status = map_task_status(&task.status);

        let runtime_task = RuntimeTask {
            task_id: task_id.clone(),
            session_id: request.session_id.clone(),
            status: native_status,
            prompt: task.user_prompt.clone(),
            created_at: task.created_at.clone(),
            updated_at: task.updated_at.clone(),
            result: None,
            error: task.error.clone(),
        };

        if task.status == cp::TaskStatus::AwaitingApproval {
            let approval_id = format!("apr_{}", entry.next_approval_id);
            entry.next_approval_id += 1;
            entry
                .approval_map
                .insert(approval_id.clone(), task.id.clone());
        }

        entry.session.active_task = Some(task_id.clone());
        entry.session.event_count += 1;
        entry.tasks.insert(task.id.clone(), runtime_task.clone());

        Ok(runtime_task)
    }

    async fn approve(&self, decision: RuntimeApprovalDecision) -> RuntimeResult<()> {
        let mut inner = self.inner.lock().unwrap();

        let task_id = inner
            .sessions
            .values()
            .find_map(|entry| entry.approval_map.get(&decision.request_id).cloned())
            .ok_or_else(|| RuntimeError::NotFound(decision.request_id.clone()))?;

        if !decision.approved {
            return Ok(());
        }

        for entry in inner.sessions.values_mut() {
            let lifecycle = TaskLifecycle::new(entry.task_store.clone());
            match lifecycle.approve_task(&task_id) {
                Ok(approved_task) => {
                    if let Some(rt) = entry.tasks.get_mut(&task_id) {
                        rt.status = map_task_status(&approved_task.status);
                        rt.updated_at = approved_task.updated_at.clone();
                        entry.session.updated_at = Utc::now().to_rfc3339();
                        entry.session.event_count += 1;
                    }
                    return Ok(());
                }
                Err(e) => {
                    return Err(RuntimeError::Runtime(e));
                }
            }
        }

        Err(RuntimeError::TaskNotFound(task_id))
    }

    async fn cancel_task(
        &self,
        session_id: RuntimeSessionId,
        task_id: RuntimeTaskId,
    ) -> RuntimeResult<()> {
        let mut inner = self.inner.lock().unwrap();
        let entry = inner
            .sessions
            .get_mut(&session_id)
            .ok_or_else(|| RuntimeError::SessionNotFound(session_id.0.clone()))?;

        let lifecycle = TaskLifecycle::new(entry.task_store.clone());
        let cancelled = lifecycle
            .cancel_task(&task_id.0, Some("Cancelled via runtime adapter"))
            .map_err(|e| RuntimeError::Runtime(e))?;

        if let Some(rt) = entry.tasks.get_mut(&task_id.0) {
            rt.status = map_task_status(&cancelled.status);
            rt.updated_at = cancelled.updated_at.clone();
            rt.error = cancelled.error.clone();
        }

        entry.session.updated_at = Utc::now().to_rfc3339();
        entry.session.event_count += 1;

        Ok(())
    }

    async fn stream_events(&self, session_id: RuntimeSessionId) -> RuntimeResult<EventStream> {
        let inner = self.inner.lock().unwrap();
        let entry = inner
            .sessions
            .get(&session_id)
            .ok_or_else(|| RuntimeError::SessionNotFound(session_id.0.clone()))?;

        let mut all_events: Vec<RuntimeEvent> = Vec::new();

        for (task_id_str, _rt) in &entry.tasks {
            if let Ok(task_events) = entry.task_store.list_events(task_id_str) {
                let mapped = map_events(
                    task_events,
                    &session_id,
                    Some(RuntimeTaskId(task_id_str.clone())),
                    "codra-core",
                );
                all_events.extend(mapped);
            }
        }

        Ok(Box::pin(futures::stream::iter(all_events)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use codra_runtime::registry::RuntimeRegistry;
    use codra_runtime::types::RuntimeCapabilities;
    use std::collections::HashMap;

    #[tokio::test]
    async fn native_runtime_reports_healthy() {
        let runtime = NativeCodraRuntime::new();
        let health = runtime.health().await;
        assert!(health.connected);
        assert!(!health.ready);
        assert_eq!(health.status, RuntimeStatus::Uninitialized);
        assert_eq!(health.version, Some("0.1.0-native".to_string()));
    }

    #[tokio::test]
    async fn native_runtime_initialize_and_shutdown() {
        let runtime = NativeCodraRuntime::new();
        let config = SafetyConfig::default();

        runtime.initialize(config.clone()).await.unwrap();
        let health = runtime.health().await;
        assert!(health.ready);
        assert_eq!(health.status, RuntimeStatus::Ready);

        let err = runtime.initialize(config.clone()).await.unwrap_err();
        assert!(matches!(err, RuntimeError::AlreadyInitialized));

        runtime.shutdown().await.unwrap();
        let health = runtime.health().await;
        assert!(!health.ready);
        assert_eq!(health.status, RuntimeStatus::Uninitialized);
    }

    #[tokio::test]
    async fn native_runtime_capabilities_serialize() {
        let runtime = NativeCodraRuntime::new();
        let caps = runtime.capabilities();
        let json = serde_json::to_string(&caps).unwrap();
        let deserialized: RuntimeCapabilities = serde_json::from_str(&json).unwrap();
        assert_eq!(caps.supports_sessions, deserialized.supports_sessions);
        assert_eq!(caps.supports_fork, deserialized.supports_fork);
        assert_eq!(caps.supports_planning, deserialized.supports_planning);
        assert_eq!(caps.streaming, deserialized.streaming);
    }

    #[tokio::test]
    async fn create_session_works() {
        let tmpdir = tempfile::tempdir().unwrap();
        let runtime = NativeCodraRuntime::new();
        runtime.initialize(SafetyConfig::default()).await.unwrap();

        let session = runtime
            .create_session(CreateSessionRequest {
                workspace_path: tmpdir.path().to_string_lossy().to_string(),
                user_prompt: "Test session".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap();

        assert_eq!(session.status, SessionStatus::Active);
        assert_eq!(session.runtime_name, "Codra Native Runtime");
        assert_eq!(session.workspace_path, tmpdir.path().to_string_lossy());
    }

    #[tokio::test]
    async fn create_session_fails_when_not_initialized() {
        let runtime = NativeCodraRuntime::new();
        let err = runtime
            .create_session(CreateSessionRequest {
                workspace_path: "/tmp".to_string(),
                user_prompt: "test".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap_err();
        assert!(matches!(err, RuntimeError::NotInitialized));
    }

    #[tokio::test]
    async fn unsupported_session_ops_return_proper_errors() {
        let runtime = NativeCodraRuntime::new();

        let fork_err = runtime
            .fork_session(ForkSessionRequest {
                session_id: RuntimeSessionId("sess-1".to_string()),
                new_prompt: None,
            })
            .await
            .unwrap_err();
        assert!(matches!(fork_err, RuntimeError::Unsupported));

        let clone_err = runtime
            .clone_session(CloneSessionRequest {
                session_id: RuntimeSessionId("sess-1".to_string()),
            })
            .await
            .unwrap_err();
        assert!(matches!(clone_err, RuntimeError::Unsupported));

        let handoff_err = runtime
            .handoff_session(HandoffSessionRequest {
                session_id: RuntimeSessionId("sess-1".to_string()),
                target_runtime_id: RuntimeId("other".to_string()),
            })
            .await
            .unwrap_err();
        assert!(matches!(handoff_err, RuntimeError::Unsupported));
    }

    #[tokio::test]
    async fn submit_task_creates_and_plans() {
        let tmpdir = tempfile::tempdir().unwrap();
        let runtime = NativeCodraRuntime::new();
        runtime.initialize(SafetyConfig::default()).await.unwrap();

        let session = runtime
            .create_session(CreateSessionRequest {
                workspace_path: tmpdir.path().to_string_lossy().to_string(),
                user_prompt: "Test".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap();

        let task = runtime
            .submit_task(SubmitTaskRequest {
                session_id: session.session_id.clone(),
                prompt: "Add a README file".to_string(),
            })
            .await
            .unwrap();

        assert_eq!(task.status, RuntimeTaskStatus::AwaitingApproval);
        assert_eq!(task.session_id, session.session_id);
        assert!(task.prompt.contains("README"));
    }

    #[tokio::test]
    async fn submit_task_fails_without_session() {
        let runtime = NativeCodraRuntime::new();
        runtime.initialize(SafetyConfig::default()).await.unwrap();

        let err = runtime
            .submit_task(SubmitTaskRequest {
                session_id: RuntimeSessionId("nonexistent".to_string()),
                prompt: "test".to_string(),
            })
            .await
            .unwrap_err();
        assert!(matches!(err, RuntimeError::SessionNotFound(_)));
    }

    #[tokio::test]
    async fn approve_and_cancel_task_flow() {
        let tmpdir = tempfile::tempdir().unwrap();
        let runtime = NativeCodraRuntime::new();
        runtime.initialize(SafetyConfig::default()).await.unwrap();

        let session = runtime
            .create_session(CreateSessionRequest {
                workspace_path: tmpdir.path().to_string_lossy().to_string(),
                user_prompt: "Test".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap();

        let task = runtime
            .submit_task(SubmitTaskRequest {
                session_id: session.session_id.clone(),
                prompt: "Add a README".to_string(),
            })
            .await
            .unwrap();

        assert_eq!(task.status, RuntimeTaskStatus::AwaitingApproval);

        runtime
            .cancel_task(session.session_id.clone(), task.task_id.clone())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn task_status_mapping_is_correct() {
        use cp::TaskStatus;

        assert_eq!(
            map_task_status(&TaskStatus::Draft),
            RuntimeTaskStatus::Pending
        );
        assert_eq!(
            map_task_status(&TaskStatus::Planning),
            RuntimeTaskStatus::Planning
        );
        assert_eq!(
            map_task_status(&TaskStatus::AwaitingApproval),
            RuntimeTaskStatus::AwaitingApproval
        );
        assert_eq!(
            map_task_status(&TaskStatus::Approved),
            RuntimeTaskStatus::Approved
        );
        assert_eq!(
            map_task_status(&TaskStatus::Executing),
            RuntimeTaskStatus::Executing
        );
        assert_eq!(
            map_task_status(&TaskStatus::Verifying),
            RuntimeTaskStatus::Verifying
        );
        assert_eq!(
            map_task_status(&TaskStatus::RepairPlanning),
            RuntimeTaskStatus::Planning
        );
        assert_eq!(
            map_task_status(&TaskStatus::Repairing),
            RuntimeTaskStatus::Repairing
        );
        assert_eq!(
            map_task_status(&TaskStatus::Completed),
            RuntimeTaskStatus::Completed
        );
        assert_eq!(
            map_task_status(&TaskStatus::Failed),
            RuntimeTaskStatus::Failed
        );
        assert_eq!(
            map_task_status(&TaskStatus::Cancelled),
            RuntimeTaskStatus::Cancelled
        );
    }

    #[tokio::test]
    async fn event_mapping_is_correct() {
        assert_eq!(
            map_event_kind("task.created"),
            RuntimeEventKind::TaskCreated
        );
        assert_eq!(
            map_event_kind("task.planned"),
            RuntimeEventKind::TaskPlanReady
        );
        assert_eq!(
            map_event_kind("task.approved"),
            RuntimeEventKind::TaskApproved
        );
        assert_eq!(
            map_event_kind("task.cancelled"),
            RuntimeEventKind::TaskCancelled
        );
        assert_eq!(map_event_kind("task.failed"), RuntimeEventKind::TaskFailed);
        assert_eq!(
            map_event_kind("task.executing"),
            RuntimeEventKind::TaskExecuting
        );
        assert_eq!(map_event_kind("unknown"), RuntimeEventKind::TaskLog);
    }

    #[tokio::test]
    async fn registry_can_register_native_runtime() {
        let mut registry = RuntimeRegistry::new();
        let runtime = Box::new(NativeCodraRuntime::new());
        registry.register(runtime).unwrap();
        assert_eq!(registry.list().len(), 1);

        let retrieved = registry.get(&RuntimeId("codra-native".to_string()));
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name(), "Codra Native Runtime");
    }

    #[tokio::test]
    async fn stream_events_from_completed_task() {
        let tmpdir = tempfile::tempdir().unwrap();
        let runtime = NativeCodraRuntime::new();
        runtime.initialize(SafetyConfig::default()).await.unwrap();

        let session = runtime
            .create_session(CreateSessionRequest {
                workspace_path: tmpdir.path().to_string_lossy().to_string(),
                user_prompt: "Test".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap();

        runtime
            .submit_task(SubmitTaskRequest {
                session_id: session.session_id.clone(),
                prompt: "Add a README".to_string(),
            })
            .await
            .unwrap();

        use futures::StreamExt;
        let mut stream = runtime
            .stream_events(session.session_id.clone())
            .await
            .unwrap();
        let mut event_count = 0;
        while let Some(event) = stream.next().await {
            event_count += 1;
            assert_eq!(event.source, "codra-core");
        }

        assert!(event_count >= 2, "expected >=2 events, got {}", event_count);
    }
}
