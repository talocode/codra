use serde::Serialize;
use serde_json::Value;
use std::io::{self, Write};

use crate::utils::time::timestamp_rfc3339;

pub const SOURCE: &str = "codra-cli";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodraEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub run_id: String,
    pub timestamp: String,
    pub task: String,
    pub source: String,
    pub data: Value,
}

impl CodraEvent {
    pub fn new(event_type: &str, run_id: &str, task: &str, data: Value) -> Self {
        Self {
            event_type: event_type.to_string(),
            run_id: run_id.to_string(),
            timestamp: timestamp_rfc3339(),
            task: task.to_string(),
            source: SOURCE.to_string(),
            data,
        }
    }

    pub fn to_json_line(&self) -> Result<String, String> {
        serde_json::to_string(self).map_err(|e| e.to_string())
    }
}

pub struct EventEmitter {
    pub run_id: String,
    pub task: String,
    pub jsonl: bool,
}

impl EventEmitter {
    pub fn new(run_id: String, task: String, jsonl: bool) -> Self {
        Self {
            run_id,
            task,
            jsonl,
        }
    }

    pub fn emit(&self, event_type: &str, data: Value) -> Result<(), String> {
        let event = CodraEvent::new(event_type, &self.run_id, &self.task, data);
        if self.jsonl {
            let line = event.to_json_line()?;
            println!("{line}");
            io::stdout().flush().map_err(|e| e.to_string())?;
        } else {
            self.emit_human(&event)?;
        }
        Ok(())
    }

    pub fn warning(&self, message: impl Into<String>) -> Result<(), String> {
        self.emit(
            "codra.warning",
            serde_json::json!({ "message": message.into() }),
        )
    }

    fn emit_human(&self, event: &CodraEvent) -> Result<(), String> {
        match event.event_type.as_str() {
            "codra.run.started" => println!("▶ Run started ({})", event.run_id),
            "codra.context.loading" => println!("… Loading context"),
            "codra.context.loaded" => {
                let available = event.data.get("available").and_then(|v| v.as_bool());
                println!(
                    "✓ Context loaded (available: {})",
                    available.unwrap_or(false)
                );
            }
            "codra.task.started" => println!("▶ Task: {}", event.task),
            "codra.task.summary" => {
                if let Some(overview) = event.data.get("overview").and_then(|v| v.as_str()) {
                    println!("\n{overview}");
                }
                if let Some(steps) = event.data.get("nextSuggestedSteps").and_then(|v| v.as_array())
                {
                    if !steps.is_empty() {
                        println!("\nSuggested next steps:");
                        for step in steps {
                            if let Some(s) = step.as_str() {
                                println!("  - {s}");
                            }
                        }
                    }
                }
            }
            "codra.task.completed" => println!("✓ Task completed"),
            "codra.run.completed" => println!("✓ Run completed"),
            "codra.run.failed" => {
                let msg = event
                    .data
                    .get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown error");
                eprintln!("✗ Run failed: {msg}");
            }
            "codra.warning" => {
                let msg = event
                    .data
                    .get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("warning");
                eprintln!("⚠ {msg}");
            }
            other => println!("[{other}]"),
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn event_serializes_required_fields() {
        let event = CodraEvent::new(
            "codra.run.started",
            "run_test_1",
            "review-pr",
            serde_json::json!({ "cwd": "/tmp", "jsonl": true }),
        );
        let line = event.to_json_line().unwrap();
        assert!(line.contains("\"type\":\"codra.run.started\""));
        assert!(line.contains("\"runId\":\"run_test_1\"") || line.contains("\"runId\": \"run_test_1\""));
        assert!(line.contains("\"source\":\"codra-cli\""));
        assert!(line.contains("\"task\":\"review-pr\""));
    }
}