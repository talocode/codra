use codra_core::{
    command_runner::RealCommandRunner, task_executor::TaskExecutor, task_lifecycle::TaskLifecycle,
    task_planner::TaskPlanner, task_store::TaskStore, task_verifier::TaskVerifier,
    workspace_scanner::WorkspaceScanner,
};
use std::path::PathBuf;
use std::time::Instant;

pub struct DaemonState {
    pub task_store: TaskStore,
    pub task_planner: TaskPlanner,
    pub task_lifecycle: TaskLifecycle,
    pub task_executor: TaskExecutor<RealCommandRunner>,
    pub task_verifier: TaskVerifier<RealCommandRunner>,
    pub workspace_scanner: WorkspaceScanner,
    pub daemon_start_time: Instant,
    pub config: DaemonConfig,
}

#[derive(Clone, Debug)]
pub struct DaemonConfig {
    pub host: String,
    pub port: u16,
    pub token: Option<String>,
    pub data_dir: PathBuf,
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
            config,
        }
    }
}
