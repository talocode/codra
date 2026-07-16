use crate::tool_dispatcher::DynTool;
use async_trait::async_trait;
use codra_protocol::{ToolCategory, ToolDefinition, ToolSafetyLevel};
use serde_json::{json, Value};
use std::path::PathBuf;

pub struct SearchReplaceTool {
    root: PathBuf,
}

impl SearchReplaceTool {
    pub fn new(workspace: &str) -> Self {
        Self {
            root: PathBuf::from(workspace),
        }
    }

    fn resolve_safe(&self, rel: &str) -> Result<PathBuf, String> {
        let joined = self.root.join(rel);
        if !joined.starts_with(&self.root) {
            return Err("Path traversal not allowed".to_string());
        }
        Ok(joined)
    }
}

#[async_trait]
impl DynTool for SearchReplaceTool {
    fn name(&self) -> &str {
        "fs.search_replace"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "fs.search_replace".to_string(),
            display_name: "Search and replace in file".to_string(),
            description: "Edit a file by searching for text and replacing it. Supports exact match and regex patterns.".to_string(),
            category: ToolCategory::Filesystem,
            safety_level: ToolSafetyLevel::WorkspaceWrite,
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "search": { "type": "string" },
                    "replace": { "type": "string" },
                    "regex": { "type": "boolean", "default": false }
                },
                "required": ["path", "search", "replace"]
            }),
        }
    }

    async fn execute(&self, args: &Value) -> Result<String, String> {
        let path = args
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'path' argument")?;
        let search = args
            .get("search")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'search' argument")?;
        let replace = args
            .get("replace")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'replace' argument")?;
        let use_regex = args
            .get("regex")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let full_path = self.resolve_safe(path)?;

        let content = std::fs::read_to_string(&full_path)
            .map_err(|e| format!("Failed to read {}: {}", path, e))?;

        let new_content = if use_regex {
            let re = regex::Regex::new(search)
                .map_err(|e| format!("Invalid regex pattern: {}", e))?;
            re.replace_all(&content, replace).to_string()
        } else {
            content.replace(search, replace)
        };

        if content == new_content {
            return Ok(format!("No matches found for '{}' in {}", search, path));
        }

        let matches = content.matches(search).count();

        std::fs::write(&full_path, &new_content)
            .map_err(|e| format!("Failed to write {}: {}", path, e))?;

        let parent = full_path.parent().unwrap_or(&self.root);
        std::fs::create_dir_all(parent).ok();

        Ok(format!(
            "Replaced {} occurrence(s) in {}",
            matches, path
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn search_replace_basic() {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("test.txt");
        std::fs::write(&file_path, "hello world").unwrap();

        let tool = SearchReplaceTool::new(dir.path().to_str().unwrap());
        let args = json!({
            "path": "test.txt",
            "search": "world",
            "replace": "rust"
        });

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(tool.execute(&args)).unwrap();
        assert!(result.contains("1 occurrence(s)"));

        let content = std::fs::read_to_string(&file_path).unwrap();
        assert_eq!(content, "hello rust");
    }

    #[test]
    fn search_replace_regex() {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("test.txt");
        std::fs::write(&file_path, "foo123bar456").unwrap();

        let tool = SearchReplaceTool::new(dir.path().to_str().unwrap());
        let args = json!({
            "path": "test.txt",
            "search": r"\d+",
            "replace": "X",
            "regex": true
        });

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(tool.execute(&args)).unwrap();

        let content = std::fs::read_to_string(&file_path).unwrap();
        assert_eq!(content, "fooXbarX");
        assert!(result.contains("occurrence(s)"));
    }

    #[test]
    fn search_replace_path_traversal_blocked() {
        let dir = TempDir::new().unwrap();
        let tool = SearchReplaceTool::new(dir.path().to_str().unwrap());
        let args = json!({
            "path": "../etc/passwd",
            "search": "x",
            "replace": "y"
        });

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(tool.execute(&args));
        assert!(result.is_err());
    }
}
