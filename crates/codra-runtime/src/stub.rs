use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use async_trait::async_trait;
use chrono::Utc;

use crate::error::{RuntimeError, RuntimeResult};
use crate::traits::{CodraRuntime, EventStream};
use crate::types::{
    CloneSessionRequest, CreateSessionRequest, ForkSessionRequest, HandoffSessionRequest,
    ResumeSessionRequest, RuntimeApprovalDecision, RuntimeCapabilities, RuntimeHealth, RuntimeId,
    RuntimeKind, RuntimeSession, RuntimeSessionId, RuntimeStatus, RuntimeTask, RuntimeTaskId,
    RuntimeTaskStatus, SafetyConfig, SessionStatus, SubmitTaskRequest, TaskResult,
};

// ── Stub Runtime ─────────────────────────────────────────────────

struct Inner {
    sessions: HashMap<RuntimeSessionId, RuntimeSession>,
    tasks: HashMap<RuntimeTaskId, RuntimeTask>,
    initialized: bool,
}

pub struct StubRuntime {
    id: RuntimeId,
    name: String,
    inner: Arc<Mutex<Inner>>,
}

impl StubRuntime {
    pub fn new() -> Self {
        Self {
            id: RuntimeId("stub-1".to_string()),
            name: "Stub Runtime".to_string(),
            inner: Arc::new(Mutex::new(Inner {
                sessions: HashMap::new(),
                tasks: HashMap::new(),
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
                tasks: HashMap::new(),
                initialized: false,
            })),
        }
    }
}

#[async_trait]
impl CodraRuntime for StubRuntime {
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
            supports_planning: false,
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
            version: Some("0.1.0-stub".to_string()),
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
        let session_id = RuntimeSessionId(uuid::Uuid::new_v4().to_string());
        let now = Utc::now().to_rfc3339();
        let session = RuntimeSession {
            session_id: session_id.clone(),
            runtime_id: self.id.clone(),
            runtime_name: self.name.clone(),
            workspace_path: request.workspace_path,
            status: SessionStatus::Active,
            created_at: now.clone(),
            updated_at: now,
            active_task: None,
            event_count: 0,
        };
        inner.sessions.insert(session_id, session.clone());
        Ok(session)
    }

    async fn resume_session(&self, request: ResumeSessionRequest) -> RuntimeResult<RuntimeSession> {
        let mut inner = self.inner.lock().unwrap();
        let session = inner
            .sessions
            .get_mut(&request.session_id)
            .ok_or_else(|| RuntimeError::SessionNotFound(request.session_id.0.clone()))?;
        session.status = SessionStatus::Active;
        session.updated_at = Utc::now().to_rfc3339();
        Ok(session.clone())
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
        if !inner.sessions.contains_key(&request.session_id) {
            return Err(RuntimeError::SessionNotFound(request.session_id.0.clone()));
        }
        let task_id = RuntimeTaskId(uuid::Uuid::new_v4().to_string());
        let now = Utc::now().to_rfc3339();
        let task = RuntimeTask {
            task_id: task_id.clone(),
            session_id: request.session_id,
            status: RuntimeTaskStatus::Completed,
            prompt: request.prompt,
            created_at: now.clone(),
            updated_at: now,
            result: Some(TaskResult {
                success: true,
                summary: "Stub task completed successfully".to_string(),
                error: None,
            }),
            error: None,
        };
        inner.tasks.insert(task_id, task.clone());
        Ok(task)
    }

    async fn approve(&self, _decision: RuntimeApprovalDecision) -> RuntimeResult<()> {
        Ok(())
    }

    async fn cancel_task(
        &self,
        session_id: RuntimeSessionId,
        task_id: RuntimeTaskId,
    ) -> RuntimeResult<()> {
        let mut inner = self.inner.lock().unwrap();
        let task = inner
            .tasks
            .get_mut(&task_id)
            .ok_or_else(|| RuntimeError::TaskNotFound(task_id.0.clone()))?;
        if task.session_id != session_id {
            return Err(RuntimeError::TaskNotFound(task_id.0));
        }
        task.status = RuntimeTaskStatus::Cancelled;
        task.updated_at = Utc::now().to_rfc3339();
        Ok(())
    }

    async fn stream_events(&self, _session_id: RuntimeSessionId) -> RuntimeResult<EventStream> {
        // Return an empty stream — the stub never generates events.
        Ok(Box::pin(futures::stream::empty()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::registry::RuntimeRegistry;
    use crate::types::RuntimeCapabilities;
    use std::collections::HashMap;

    #[tokio::test]
    async fn registry_registers_and_lists_runtimes() {
        let mut registry = RuntimeRegistry::new();
        let stub1 = Box::new(StubRuntime::new());
        let stub2 = Box::new(StubRuntime::new_with_id("stub-2", "Stub 2"));
        registry.register(stub1).unwrap();
        registry.register(stub2).unwrap();
        assert_eq!(registry.list().len(), 2);
    }

    #[tokio::test]
    async fn registry_retrieves_by_id() {
        let mut registry = RuntimeRegistry::new();
        let stub = Box::new(StubRuntime::new());
        registry.register(stub).unwrap();
        let retrieved = registry.get(&RuntimeId("stub-1".to_string()));
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name(), "Stub Runtime");
    }

    #[tokio::test]
    async fn registry_prevents_duplicate_registration() {
        let mut registry = RuntimeRegistry::new();
        let stub1 = Box::new(StubRuntime::new());
        let stub2 = Box::new(StubRuntime::new());
        registry.register(stub1).unwrap();
        let result = registry.register(stub2);
        assert!(result.is_err());
        assert!(matches!(result, Err(RuntimeError::AlreadyRegistered(_))));
    }

    #[tokio::test]
    async fn runtime_capabilities_serialize() {
        let caps = RuntimeCapabilities {
            supports_sessions: true,
            supports_resume: true,
            supports_fork: false,
            supports_clone: false,
            supports_handoff: false,
            supports_approval: true,
            supports_event_streaming: true,
            supports_planning: false,
            supports_verification: false,
            supports_repair: false,
            max_concurrent_sessions: 5,
            available_tools: vec!["read".to_string(), "write".to_string()],
            streaming: false,
        };
        let json = serde_json::to_string(&caps).unwrap();
        let deserialized: RuntimeCapabilities = serde_json::from_str(&json).unwrap();
        assert_eq!(caps, deserialized);
    }

    #[tokio::test]
    async fn stub_runtime_creates_session() {
        let runtime = StubRuntime::new();
        let session = runtime
            .create_session(CreateSessionRequest {
                workspace_path: "/test".to_string(),
                user_prompt: "Hello".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap();
        assert_eq!(session.status, SessionStatus::Active);
        assert_eq!(session.workspace_path, "/test");
    }

    #[tokio::test]
    async fn stub_runtime_submits_task() {
        let runtime = StubRuntime::new();
        let session = runtime
            .create_session(CreateSessionRequest {
                workspace_path: "/test".to_string(),
                user_prompt: "Test".to_string(),
                initial_context: None,
                metadata: HashMap::new(),
            })
            .await
            .unwrap();
        let task = runtime
            .submit_task(SubmitTaskRequest {
                session_id: session.session_id.clone(),
                prompt: "Do something".to_string(),
            })
            .await
            .unwrap();
        assert_eq!(task.session_id, session.session_id);
        assert_eq!(task.status, RuntimeTaskStatus::Completed);
        assert!(task.result.is_some());
        assert!(task.result.unwrap().success);
    }

    #[tokio::test]
    async fn approval_type_serializes() {
        let request = crate::types::RuntimeApprovalRequest {
            id: "req-1".to_string(),
            session_id: RuntimeSessionId("sess-1".to_string()),
            task_id: RuntimeTaskId("task-1".to_string()),
            kind: crate::types::ActionKind::WriteFile,
            description: "Write to src/main.rs".to_string(),
            details: serde_json::json!({"path": "src/main.rs"}),
            created_at: "2025-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&request).unwrap();
        let deserialized: crate::types::RuntimeApprovalRequest =
            serde_json::from_str(&json).unwrap();
        assert_eq!(request.id, deserialized.id);
        assert_eq!(request.kind, deserialized.kind);

        let decision = RuntimeApprovalDecision {
            request_id: "req-1".to_string(),
            approved: true,
            reason: Some("Looks good".to_string()),
        };
        let json = serde_json::to_string(&decision).unwrap();
        let deserialized: RuntimeApprovalDecision = serde_json::from_str(&json).unwrap();
        assert!(deserialized.approved);
        assert_eq!(deserialized.reason, Some("Looks good".to_string()));
    }

    #[tokio::test]
    async fn health_check_all_works() {
        let mut registry = RuntimeRegistry::new();
        registry.register(Box::new(StubRuntime::new())).unwrap();
        registry
            .register(Box::new(StubRuntime::new_with_id("stub-2", "Stub 2")))
            .unwrap();
        let results = registry.health_check_all().await;
        assert_eq!(results.len(), 2);
        for (_id, health) in &results {
            assert!(health.connected);
            assert!(!health.ready);
            assert_eq!(health.status, RuntimeStatus::Uninitialized);
        }
    }
}
