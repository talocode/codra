use async_trait::async_trait;
use codra_protocol::ToolDefinition;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub tool_name: String,
    pub arguments: Value,
}

#[derive(Debug, Clone)]
pub struct ToolOutput {
    pub call_id: String,
    pub success: bool,
    pub output: String,
}

#[async_trait]
pub trait ToolDispatcher: Send + Sync {
    fn tool_definitions(&self) -> Vec<ToolDefinition>;
    async fn execute_tool(&mut self, call: &ToolCall) -> Result<ToolOutput, String>;
}

pub struct CodraToolDispatcher {
    tools: HashMap<String, Box<dyn DynTool>>,
    file_locks: HashMap<String, Arc<tokio::sync::Mutex<()>>>,
}

use std::collections::HashMap;
use std::sync::Arc;

#[async_trait]
pub trait DynTool: Send + Sync {
    fn name(&self) -> &str;
    fn definition(&self) -> ToolDefinition;
    async fn execute(&self, args: &Value) -> Result<String, String>;
}

impl CodraToolDispatcher {
    pub fn new() -> Self {
        Self {
            tools: HashMap::new(),
            file_locks: HashMap::new(),
        }
    }

    pub fn register_tool(&mut self, tool: Box<dyn DynTool>) {
        self.tools.insert(tool.name().to_string(), tool);
    }

    fn get_file_lock(&mut self, path: &str) -> Arc<tokio::sync::Mutex<()>> {
        self.file_locks
            .entry(path.to_string())
            .or_insert_with(|| Arc::new(tokio::sync::Mutex::new(())))
            .clone()
    }
}

#[async_trait]
impl ToolDispatcher for CodraToolDispatcher {
    fn tool_definitions(&self) -> Vec<ToolDefinition> {
        self.tools.values().map(|t| t.definition()).collect()
    }

    async fn execute_tool(&mut self, call: &ToolCall) -> Result<ToolOutput, String> {
        let is_write_tool = matches!(
            call.tool_name.as_str(),
            "fs.write_checkpointed" | "fs.search_replace"
        );

        if is_write_tool {
            let path = call
                .arguments
                .get("path")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let lock = self.get_file_lock(&path);
            let _guard = lock.lock().await;

            let tool = self
                .tools
                .get(&call.tool_name)
                .ok_or_else(|| format!("Unknown tool: {}", call.tool_name))?;
            let result = tool.execute(&call.arguments).await;
            drop(_guard);
            result.map(|output| ToolOutput {
                call_id: call.id.clone(),
                success: true,
                output,
            })
        } else {
            let tool = self
                .tools
                .get(&call.tool_name)
                .ok_or_else(|| format!("Unknown tool: {}", call.tool_name))?;
            let result = tool.execute(&call.arguments).await;
            result.map(|output| ToolOutput {
                call_id: call.id.clone(),
                success: true,
                output,
            })
        }
    }
}

use crate::tools_impl::search_replace::SearchReplaceTool;
use crate::tools_impl::fs_read::FsReadTool;

pub fn create_default_dispatcher(workspace_path: &str) -> CodraToolDispatcher {
    let mut dispatcher = CodraToolDispatcher::new();
    dispatcher.register_tool(Box::new(FsReadTool::new(workspace_path)));
    dispatcher.register_tool(Box::new(SearchReplaceTool::new(workspace_path)));
    dispatcher
}
