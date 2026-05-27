use codra_core::{
    command_runner::RealCommandRunner, task_executor::TaskExecutor, task_lifecycle::TaskLifecycle,
    task_planner::TaskPlanner, task_store::TaskStore, task_verifier::TaskVerifier,
    workspace_scanner::WorkspaceScanner,
};
use serde::Serialize;
use std::path::PathBuf;
use std::time::Instant;

/// Response payload for GET /api/workers/health.
#[derive(Debug, Clone, Serialize)]
pub struct WorkerHealthResponse {
    pub status: String,
    pub daemon_id: String,
    pub version: String,
    pub hostname: String,
    pub os: String,
    pub arch: String,
    pub uptime_seconds: u64,
    pub supported_runtime_kinds: Vec<String>,
    pub available_runtimes: Vec<String>,
    pub workspace_mode: String,
    pub remote_worker_protocol_version: String,
    pub capabilities: WorkerCapabilities,
}

#[derive(Debug, Clone, Serialize)]
pub struct WorkerCapabilities {
    pub task_execution: bool,
    pub event_streaming: bool,
    pub approval_forwarding: bool,
    pub remote_pairing: bool,
    pub mdns_discovery: bool,
}

pub struct DaemonState {
    pub task_store: TaskStore,
    pub task_planner: TaskPlanner,
    pub task_lifecycle: TaskLifecycle,
    pub task_executor: TaskExecutor<RealCommandRunner>,
    pub task_verifier: TaskVerifier<RealCommandRunner>,
    pub workspace_scanner: WorkspaceScanner,
    pub daemon_start_time: Instant,
    pub daemon_id: String,
    pub config: DaemonConfig,
}

#[derive(Clone, Debug)]
pub struct DaemonConfig {
    pub host: String,
    pub port: u16,
    pub token: Option<String>,
    pub data_dir: PathBuf,
}

fn hostname() -> String {
    std::env::var("HOSTNAME").unwrap_or_else(|_| {
        std::fs::read_to_string("/etc/hostname")
            .ok()
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "localhost".to_string())
    })
}

impl DaemonState {
    pub fn new(config: DaemonConfig) -> Self {
        let _ = std::fs::create_dir_all(&config.data_dir);

        let task_store = TaskStore::new(&config.data_dir);
        let task_planner = TaskPlanner::new(task_store.clone());
        let task_lifecycle = TaskLifecycle::new(task_store.clone());
        let task_executor = TaskExecutor::new(task_store.clone());
        let task_verifier = TaskVerifier::new(task_store.clone(), RealCommandRunner);
        let workspace_scanner = WorkspaceScanner;

        Self {
            task_store,
            task_planner,
            task_lifecycle,
            task_executor,
            task_verifier,
            workspace_scanner,
            daemon_start_time: Instant::now(),
            daemon_id: format!("codra-daemon-{}", hostname()),
            config,
        }
    }

    /// Build a snapshot of worker health info.
    pub fn worker_health(&self) -> WorkerHealthResponse {
        let os = std::env::consts::OS.to_string();
        let arch = std::env::consts::ARCH.to_string();
        let uptime = self.daemon_start_time.elapsed().as_secs();

        WorkerHealthResponse {
            status: "ok".to_string(),
            daemon_id: self.daemon_id.clone(),
            version: "0.1.0".to_string(),
            hostname: hostname(),
            os,
            arch,
            uptime_seconds: uptime,
            supported_runtime_kinds: vec!["local_agent".to_string()],
            available_runtimes: vec![],
            workspace_mode: "local_only".to_string(),
            remote_worker_protocol_version: "0.1".to_string(),
            capabilities: WorkerCapabilities {
                task_execution: true,
                event_streaming: true,
                approval_forwarding: false,
                remote_pairing: false,
                mdns_discovery: false,
            },
        }
    }
}
