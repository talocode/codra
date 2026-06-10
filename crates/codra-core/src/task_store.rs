use codra_protocol::{Task, TaskEvent};
use serde_json;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Clone)]
pub struct TaskStore {
    workspace_root: PathBuf,
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
            workspace_root: root.to_path_buf(),
            tasks_dir,
            events_dir,
        }
    }

    pub fn workspace_root(&self) -> &Path {
        &self.workspace_root
    }

    pub fn assert_task_workspace(&self, task: &Task) -> Result<(), String> {
        let task_workspace = task.workspace_path.trim();
        if task_workspace.is_empty() {
            return Err("Task workspace_path is required".to_string());
        }

        if !workspace_paths_equivalent(self.workspace_root(), Path::new(task_workspace)) {
            return Err(format!(
                "Task {} belongs to workspace {}, not {}",
                task.id,
                task.workspace_path,
                self.workspace_root().display()
            ));
        }

        Ok(())
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

fn workspace_paths_equivalent(expected: &Path, actual: &Path) -> bool {
    if let (Ok(expected_canon), Ok(actual_canon)) =
        (expected.canonicalize(), actual.canonicalize())
    {
        return expected_canon == actual_canon;
    }

    normalize_workspace_path(expected) == normalize_workspace_path(actual)
}

fn normalize_workspace_path(path: &Path) -> String {
    let mut normalized = path.to_string_lossy().replace('\\', "/");
    while normalized.len() > 1 && normalized.ends_with('/') {
        normalized.pop();
    }
    normalized
}
