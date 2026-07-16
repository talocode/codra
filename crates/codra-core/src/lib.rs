pub mod agent_loop;
pub mod compaction;
pub mod config;
pub mod cost_tracker;
pub mod deploy;
pub mod executor;
pub mod git_tools;
pub mod history_repair;
pub mod hooks;
pub mod planner;
pub mod prompts;
pub mod provider;
pub mod provider_config;
pub mod repair;
pub mod sandbox;
pub mod services;
pub mod session;
pub mod subagent;
pub mod task_store;
pub mod token_counter;
pub mod tool_dispatcher;
pub mod tools_impl;
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
