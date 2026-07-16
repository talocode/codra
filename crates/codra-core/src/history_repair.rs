use std::path::{Path, PathBuf};

pub struct HistoryRepair {
    history_path: PathBuf,
}

#[derive(Debug)]
pub struct RepairReport {
    pub orphaned_tool_results: usize,
    pub duplicated_entries: usize,
    pub synthetic_results_inserted: usize,
    pub total_entries_processed: usize,
}

impl HistoryRepair {
    pub fn new(history_path: impl Into<PathBuf>) -> Self {
        Self {
            history_path: history_path.into(),
        }
    }

    pub fn repair(&self) -> Result<RepairReport, String> {
        if !self.history_path.exists() {
            return Ok(RepairReport {
                orphaned_tool_results: 0,
                duplicated_entries: 0,
                synthetic_results_inserted: 0,
                total_entries_processed: 0,
            });
        }

        let content = std::fs::read_to_string(&self.history_path)
            .map_err(|e| format!("Failed to read history: {}", e))?;

        let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();
        let mut report = RepairReport {
            orphaned_tool_results: 0,
            duplicated_entries: 0,
            synthetic_results_inserted: 0,
            total_entries_processed: lines.len(),
        };

        let mut tool_call_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut tool_result_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut entries_to_remove: Vec<usize> = Vec::new();

        for (i, line) in lines.iter().enumerate() {
            if let Ok(entry) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(role) = entry.get("role").and_then(|v| v.as_str()) {
                    if role == "assistant" {
                        if let Some(calls) = entry.get("tool_calls").and_then(|v| v.as_array()) {
                            for call in calls {
                                if let Some(id) = call.get("id").and_then(|v| v.as_str()) {
                                    tool_call_ids.insert(id.to_string());
                                }
                            }
                        }
                    } else if role == "tool" {
                        if let Some(id) = entry.get("tool_call_id").and_then(|v| v.as_str()) {
                            if tool_result_ids.contains(id) {
                                report.duplicated_entries += 1;
                                entries_to_remove.push(i);
                            } else {
                                tool_result_ids.insert(id.to_string());
                            }
                        }
                    }
                }
            }
        }

        for id in &tool_call_ids {
            if !tool_result_ids.contains(id) {
                let synthetic = serde_json::json!({
                    "role": "tool",
                    "content": "[Synthetic result - original was lost]",
                    "tool_call_id": id
                });
                lines.push(serde_json::to_string(&synthetic).unwrap_or_default());
                report.synthetic_results_inserted += 1;
            }
        }

        report.orphaned_tool_results = tool_result_ids
            .iter()
            .filter(|id| !tool_call_ids.contains(*id))
            .count();

        for i in entries_to_remove.iter().rev() {
            lines.remove(*i);
        }

        let repaired: Vec<&str> = lines.iter().map(|l| l.as_str()).collect();
        std::fs::write(&self.history_path, repaired.join("\n"))
            .map_err(|e| format!("Failed to write repaired history: {}", e))?;

        Ok(report)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn repair_orphaned_tool_result() {
        let dir = TempDir::new().unwrap();
        let history_path = dir.path().join("chat.jsonl");

        let lines = vec![
            serde_json::json!({"role": "assistant", "tool_calls": [{"id": "call_1", "type": "function"}]}),
            serde_json::json!({"role": "tool", "content": "result", "tool_call_id": "call_1"}),
            serde_json::json!({"role": "assistant", "tool_calls": [{"id": "call_2", "type": "function"}]}),
        ];

        let content: Vec<String> = lines.iter().map(|l| serde_json::to_string(l).unwrap()).collect();
        std::fs::write(&history_path, content.join("\n")).unwrap();

        let repair = HistoryRepair::new(&history_path);
        let report = repair.repair().unwrap();

        assert_eq!(report.synthetic_results_inserted, 1);
        assert_eq!(report.total_entries_processed, 3);
    }

    #[test]
    fn repair_deduplicates() {
        let dir = TempDir::new().unwrap();
        let history_path = dir.path().join("chat.jsonl");

        let lines = vec![
            serde_json::json!({"role": "assistant", "tool_calls": [{"id": "call_1"}]}),
            serde_json::json!({"role": "tool", "content": "r1", "tool_call_id": "call_1"}),
            serde_json::json!({"role": "tool", "content": "r1_dup", "tool_call_id": "call_1"}),
        ];

        let content: Vec<String> = lines.iter().map(|l| serde_json::to_string(l).unwrap()).collect();
        std::fs::write(&history_path, content.join("\n")).unwrap();

        let repair = HistoryRepair::new(&history_path);
        let report = repair.repair().unwrap();

        assert_eq!(report.duplicated_entries, 1);
    }
}
