use crate::agent_loop::{AgentConfig, AgentLoop, AgentMessage, AgentLoopResult};
use crate::provider::IntelligenceProvider;
use crate::tool_dispatcher::{DynTool, ToolDispatcher, CodraToolDispatcher};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentRequest {
    pub task: String,
    pub agent_type: SubagentType,
    pub workspace_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubagentType {
    GeneralPurpose,
    Explore,
    Plan,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentResult {
    pub task_id: String,
    pub status: String,
    pub output: String,
    pub tool_calls_made: usize,
}

pub struct SubagentSpawner {
    provider: Arc<dyn IntelligenceProvider + Send + Sync>,
}

impl SubagentSpawner {
    pub fn new(provider: Arc<dyn IntelligenceProvider + Send + Sync>) -> Self {
        Self { provider }
    }

    pub async fn spawn(
        &self,
        request: SubagentRequest,
    ) -> Result<SubagentResult, String> {
        let task_id = uuid::Uuid::new_v4().to_string();

        let system_prompt = match request.agent_type {
            SubagentType::GeneralPurpose => {
                "You are a general-purpose coding subagent. Execute the given task autonomously using available tools. Report what you did and any files changed."
            }
            SubagentType::Explore => {
                "You are a read-only exploration subagent. Analyze the codebase to answer questions. Do NOT modify any files. Report your findings."
            }
            SubagentType::Plan => {
                "You are a planning subagent. Analyze the task and produce a detailed plan. Do NOT execute changes. Report the plan."
            }
        };

        let config = AgentConfig {
            system_prompt: system_prompt.to_string(),
            max_turns: 20,
            max_tokens: Some(4096),
            temperature: Some(0.2),
            auto_compact_threshold: 0.85,
        };

        let dispatcher: Arc<Mutex<dyn ToolDispatcher + Send + Sync>> =
            Arc::new(Mutex::new(CodraToolDispatcher::new()));

        let agent = AgentLoop::new(self.provider.as_ref(), dispatcher, config);
        let mut conversation = Vec::new();
        let result = agent.run(&request.task, &mut conversation).await?;

        Ok(SubagentResult {
            task_id,
            status: "completed".to_string(),
            output: result.final_text,
            tool_calls_made: result.tool_calls_made,
        })
    }
}
