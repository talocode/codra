use crate::tool_dispatcher::DynTool;
use async_trait::async_trait;
use codra_protocol::{ToolCategory, ToolDefinition, ToolSafetyLevel};
use serde_json::{json, Value};
use std::path::PathBuf;

pub struct GitBranchTool {
    root: PathBuf,
}

impl GitBranchTool {
    pub fn new(workspace: &str) -> Self {
        Self {
            root: PathBuf::from(workspace),
        }
    }

    async fn run_git(&self, args: &[&str]) -> Result<String, String> {
        let output = tokio::process::Command::new("git")
            .args(args)
            .current_dir(&self.root)
            .output()
            .await
            .map_err(|e| format!("Failed to run git: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Git error: {}", stderr));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
}

#[async_trait]
impl DynTool for GitBranchTool {
    fn name(&self) -> &str {
        "git.branch"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "git.branch".to_string(),
            display_name: "Git branch operations".to_string(),
            description: "Create, list, or switch git branches.".to_string(),
            category: ToolCategory::Git,
            safety_level: ToolSafetyLevel::WorkspaceWrite,
            input_schema: json!({
                "type": "object",
                "properties": {
                    "action": { "type": "string", "enum": ["create", "list", "switch"] },
                    "branch_name": { "type": "string" }
                },
                "required": ["action"]
            }),
        }
    }

    async fn execute(&self, args: &Value) -> Result<String, String> {
        let action = args
            .get("action")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'action' argument")?;

        match action {
            "list" => self.run_git(&["branch", "--list"]).await,
            "create" => {
                let name = args
                    .get("branch_name")
                    .and_then(|v| v.as_str())
                    .ok_or("Missing 'branch_name' for create")?;
                self.run_git(&["checkout", "-b", name]).await
            }
            "switch" => {
                let name = args
                    .get("branch_name")
                    .and_then(|v| v.as_str())
                    .ok_or("Missing 'branch_name' for switch")?;
                self.run_git(&["checkout", name]).await
            }
            _ => Err(format!("Unknown action: {}", action)),
        }
    }
}

pub struct GitCommitTool {
    root: PathBuf,
}

impl GitCommitTool {
    pub fn new(workspace: &str) -> Self {
        Self {
            root: PathBuf::from(workspace),
        }
    }
}

#[async_trait]
impl DynTool for GitCommitTool {
    fn name(&self) -> &str {
        "git.commit"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "git.commit".to_string(),
            display_name: "Git commit".to_string(),
            description: "Stage all changes and create a commit.".to_string(),
            category: ToolCategory::Git,
            safety_level: ToolSafetyLevel::WorkspaceWrite,
            input_schema: json!({
                "type": "object",
                "properties": {
                    "message": { "type": "string" }
                },
                "required": ["message"]
            }),
        }
    }

    async fn execute(&self, args: &Value) -> Result<String, String> {
        let message = args
            .get("message")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'message' argument")?;

        let output = tokio::process::Command::new("git")
            .args(["add", "-A"])
            .current_dir(&self.root)
            .output()
            .await
            .map_err(|e| format!("Failed to run git add: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "git add failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let output = tokio::process::Command::new("git")
            .args(["commit", "-m", message])
            .current_dir(&self.root)
            .output()
            .await
            .map_err(|e| format!("Failed to run git commit: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("nothing to commit") {
                return Ok("Nothing to commit".to_string());
            }
            return Err(format!("git commit failed: {}", stderr));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
}

pub struct GitStatusTool {
    root: PathBuf,
}

impl GitStatusTool {
    pub fn new(workspace: &str) -> Self {
        Self {
            root: PathBuf::from(workspace),
        }
    }
}

#[async_trait]
impl DynTool for GitStatusTool {
    fn name(&self) -> &str {
        "git.status"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "git.status".to_string(),
            display_name: "Git status".to_string(),
            description: "Get the current git status including branch and changed files.".to_string(),
            category: ToolCategory::Git,
            safety_level: ToolSafetyLevel::ReadOnly,
            input_schema: json!({ "type": "object", "properties": {} }),
        }
    }

    async fn execute(&self, _args: &Value) -> Result<String, String> {
        let output = tokio::process::Command::new("git")
            .args(["status", "--short"])
            .current_dir(&self.root)
            .output()
            .await
            .map_err(|e| format!("Failed to run git: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();

        let branch_output = tokio::process::Command::new("git")
            .args(["branch", "--show-current"])
            .current_dir(&self.root)
            .output()
            .await
            .map_err(|e| format!("Failed to run git: {}", e))?;

        let branch = String::from_utf8_lossy(&branch_output.stdout).trim().to_string();

        Ok(format!("Branch: {}\nChanges:\n{}", branch, stdout))
    }
}
