use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone)]
pub enum HookEvent<'a> {
    PreToolUse {
        tool_name: String,
        arguments: Value,
    },
    PostToolUse {
        tool_name: String,
        success: bool,
    },
    SessionStart,
    SessionEnd,
    PreCompact,
    PostCompact,
    UserPromptSubmit {
        prompt: &'a str,
    },
}

#[derive(Debug, Clone)]
pub enum HookDecision {
    Allow,
    Deny { reason: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookConfig {
    pub event: String,
    pub matcher: Option<String>,
    pub handler: HookHandler,
    #[serde(default = "default_fail_open")]
    pub fail_open: bool,
}

fn default_fail_open() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HookHandler {
    Shell { command: String },
    Http { url: String },
}

pub struct HookSystem {
    hooks: Vec<HookConfig>,
}

impl HookSystem {
    pub fn new() -> Self {
        Self { hooks: vec![] }
    }

    pub fn with_hooks(mut self, hooks: Vec<HookConfig>) -> Self {
        self.hooks = hooks;
        self
    }

    pub fn load_from_dir(&mut self, dir: &std::path::Path) {
        if !dir.exists() {
            return;
        }
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("json") {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        if let Ok(hook) = serde_json::from_str::<HookConfig>(&content) {
                            self.hooks.push(hook);
                        }
                    }
                }
            }
        }
    }

    pub async fn dispatch(&self, event: HookEvent<'_>) -> HookDecision {
        let event_name = match &event {
            HookEvent::PreToolUse { .. } => "pre_tool_use",
            HookEvent::PostToolUse { .. } => "post_tool_use",
            HookEvent::SessionStart => "session_start",
            HookEvent::SessionEnd => "session_end",
            HookEvent::PreCompact => "pre_compact",
            HookEvent::PostCompact => "post_compact",
            HookEvent::UserPromptSubmit { .. } => "user_prompt_submit",
        };

        let tool_name = match &event {
            HookEvent::PreToolUse { tool_name, .. } => Some(tool_name.as_str()),
            HookEvent::PostToolUse { tool_name, .. } => Some(tool_name.as_str()),
            _ => None,
        };

        for hook in &self.hooks {
            if hook.event != event_name {
                continue;
            }

            if let Some(ref matcher) = hook.matcher {
                if let Some(name) = tool_name {
                    if !name.contains(matcher.as_str()) {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            match self.execute_handler(&hook.handler).await {
                Ok(output) => {
                    if event_name == "pre_tool_use" && output.contains("DENY") {
                        return HookDecision::Deny {
                            reason: output,
                        };
                    }
                }
                Err(e) => {
                    if !hook.fail_open {
                        return HookDecision::Deny {
                            reason: format!("Hook failed: {}", e),
                        };
                    }
                }
            }
        }

        HookDecision::Allow
    }

    async fn execute_handler(&self, handler: &HookHandler) -> Result<String, String> {
        match handler {
            HookHandler::Shell { command } => {
                let output = tokio::process::Command::new("sh")
                    .arg("-c")
                    .arg(command)
                    .output()
                    .await
                    .map_err(|e| format!("Failed to run hook: {}", e))?;
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                Ok(stdout)
            }
            HookHandler::Http { url } => {
                let client = reqwest::Client::new();
                let resp = client
                    .post(url)
                    .send()
                    .await
                    .map_err(|e| format!("Hook HTTP request failed: {}", e))?;
                let body = resp.text().await.unwrap_or_default();
                Ok(body)
            }
        }
    }
}

impl Default for HookSystem {
    fn default() -> Self {
        Self::new()
    }
}
