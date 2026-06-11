use std::collections::HashMap;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MemorySource {
    LocalMarkdown,
    TaskEvent,
    Connector,
    Supermemory,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryScope {
    pub user_id: Option<String>,
    pub user_label: Option<String>,
    pub project_path: PathBuf,
    pub project_name: Option<String>,
    pub task_id: Option<String>,
}

impl MemoryScope {
    pub fn new(project_path: PathBuf) -> Self {
        let project_name = project_path
            .file_name()
            .and_then(|n| n.to_str())
            .map(str::to_string);
        Self {
            user_id: None,
            user_label: None,
            project_path,
            project_name,
            task_id: None,
        }
    }

    pub fn with_task(mut self, task_id: impl Into<String>) -> Self {
        self.task_id = Some(task_id.into());
        self
    }

    pub fn with_user(mut self, user_label: impl Into<String>) -> Self {
        self.user_label = Some(user_label.into());
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryAddInput {
    pub content: String,
    pub scope: MemoryScope,
    pub metadata: HashMap<String, String>,
    pub custom_id: Option<String>,
    pub is_static: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryRecord {
    pub id: String,
    pub content: String,
    pub scope: MemoryScope,
    pub metadata: HashMap<String, String>,
    pub created_at: String,
    pub source: MemorySource,
    pub source_path: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySearchResult {
    pub id: String,
    pub content: String,
    pub score: f32,
    pub source: MemorySource,
    pub source_path: PathBuf,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UserProjectProfile {
    pub static_facts: Vec<String>,
    pub dynamic_facts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryContextQuery {
    pub scope: MemoryScope,
    pub query: Option<String>,
    pub threshold: f32,
    pub limit: usize,
    pub include_profile: bool,
    pub budget: MemoryBudget,
}

impl Default for MemoryContextQuery {
    fn default() -> Self {
        Self {
            scope: MemoryScope::new(PathBuf::from(".")),
            query: None,
            threshold: 0.3,
            limit: 10,
            include_profile: true,
            budget: MemoryBudget::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySection {
    pub name: String,
    pub source_path: Option<PathBuf>,
    pub content: String,
    pub chars_used: usize,
    pub present: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryContextBundle {
    pub provider: String,
    pub scope: MemoryScope,
    pub profile: UserProjectProfile,
    pub sections: Vec<MemorySection>,
    pub recall_results: Vec<MemorySearchResult>,
    pub budget: MemoryBudget,
    pub total_chars: usize,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryBudget {
    pub total: usize,
    pub user_md: usize,
    pub global_memory_md: usize,
    pub project_memory_md: usize,
    pub checkpoint_md: usize,
    pub progress_md: usize,
    pub notes_md: usize,
    pub search_results: usize,
}

impl Default for MemoryBudget {
    fn default() -> Self {
        Self {
            total: 12_000,
            user_md: 2_000,
            global_memory_md: 3_000,
            project_memory_md: 4_000,
            checkpoint_md: 3_000,
            progress_md: 2_000,
            notes_md: 2_000,
            search_results: 3_000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryFileStatus {
    pub path: PathBuf,
    pub present: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStatusReport {
    pub provider: String,
    pub scope: MemoryScope,
    pub global_files: Vec<MemoryFileStatus>,
    pub project_files: Vec<MemoryFileStatus>,
    pub task_files: Vec<MemoryFileStatus>,
}