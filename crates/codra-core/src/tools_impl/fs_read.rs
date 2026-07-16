use crate::tool_dispatcher::{DynTool, ToolCall, ToolOutput};
use async_trait::async_trait;
use codra_protocol::{ToolCategory, ToolDefinition, ToolSafetyLevel};
use serde_json::{json, Value};
use std::path::PathBuf;

pub struct FsReadTool {
    root: PathBuf,
}

impl FsReadTool {
    pub fn new(workspace: &str) -> Self {
        Self {
            root: PathBuf::from(workspace),
        }
    }
}

#[async_trait]
impl DynTool for FsReadTool {
    fn name(&self) -> &str {
        "fs.read"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "fs.read".to_string(),
            display_name: "Read file".to_string(),
            description: "Read a workspace file without mutating state.".to_string(),
            category: ToolCategory::Filesystem,
            safety_level: ToolSafetyLevel::ReadOnly,
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" }
                },
                "required": ["path"]
            }),
        }
    }

    async fn execute(&self, args: &Value) -> Result<String, String> {
        let path = args
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'path' argument")?;

        let full_path = self.root.join(path);
        if !full_path.starts_with(&self.root) {
            return Err("Path traversal not allowed".to_string());
        }

        std::fs::read_to_string(&full_path).map_err(|e| format!("Failed to read file: {}", e))
    }
}
