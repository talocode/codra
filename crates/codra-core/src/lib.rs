// pub mod architect;
pub mod config;
pub mod deploy;
pub mod executor;
pub mod planner;
pub mod prompts;
pub mod provider;
pub mod provider_config;
pub mod repair;
pub mod services;
pub mod task_store;
pub mod verifier;

pub struct ExecutionContext {
    pub task_id: String,
    pub status: String,
}

impl ExecutionContext {
    pub fn new(task_id: impl Into<String>) -> Self {
        Self {
            task_id: task_id.into(),
            status: "IDLE".to_string(),
        }
    }
}
pub mod command_runner;
pub mod command_safety;
pub mod file_changes;
pub mod task_executor;
pub mod task_lifecycle;
pub mod task_planner;
pub mod task_verifier;
pub mod workspace_scanner;
