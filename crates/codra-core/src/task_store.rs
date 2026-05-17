use codra_protocol::{Task, TaskEvent};
use serde_json;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

pub struct TaskStore {
    tasks_dir: PathBuf,
    events_dir: PathBuf,
}

impl TaskStore {
    pub fn new(root: impl AsRef<Path>) -> Self {
        let root = root.as_ref();
        let tasks_dir = root.join(".codra").join("tasks");
        let events_dir = tasks_dir.join("events");

        let _ = fs::create_dir_all(&tasks_dir);
        let _ = fs::create_dir_all(&events_dir);

        Self {
            tasks_dir,
            events_dir,
        }
    }

    pub fn save_task(&self, task: &Task) -> Result<(), String> {
        let path = self.tasks_dir.join(format!("{}.json", task.id));
        let data = serde_json::to_string_pretty(task).map_err(|e| e.to_string())?;
        fs::write(path, data).map_err(|e| e.to_string())
    }

    pub fn load_task(&self, task_id: &str) -> Result<Task, String> {
        let path = self.tasks_dir.join(format!("{}.json", task_id));
        let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    }

    pub fn list_tasks(&self) -> Result<Vec<Task>, String> {
        let mut tasks = Vec::new();
        if let Ok(entries) = fs::read_dir(&self.tasks_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().map_or(false, |ext| ext == "json") {
                    if let Ok(data) = fs::read_to_string(entry.path()) {
                        if let Ok(task) = serde_json::from_str::<Task>(&data) {
                            tasks.push(task);
                        }
                    }
                }
            }
        }
        Ok(tasks)
    }

    pub fn append_event(&self, event: &TaskEvent) -> Result<(), String> {
        let path = self.events_dir.join(format!("{}.jsonl", event.task_id));
        let line = serde_json::to_string(event).map_err(|e| e.to_string())? + "\n";
        fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .map_err(|e| e.to_string())?
            .write_all(line.as_bytes())
            .map_err(|e| e.to_string())
    }

    pub fn list_events(&self, task_id: &str) -> Result<Vec<TaskEvent>, String> {
        let path = self.events_dir.join(format!("{}.jsonl", task_id));
        let mut events = Vec::new();
        if path.exists() {
            let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
            for line in content.lines() {
                if !line.trim().is_empty() {
                    if let Ok(event) = serde_json::from_str::<TaskEvent>(line) {
                        events.push(event);
                    }
                }
            }
        }
        Ok(events)
    }
}
