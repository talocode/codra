use std::path::{Path, PathBuf};

use crate::types::MemoryScope;

pub const WORKSPACE_MEMORY_DIR: &str = ".codra";
pub const GLOBAL_MEMORY_DIR: &str = ".codra";

pub fn home_dir() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("USERPROFILE").map(PathBuf::from))
        .unwrap_or_else(|| PathBuf::from("/root"))
}

pub fn global_codra_dir() -> PathBuf {
    home_dir().join(GLOBAL_MEMORY_DIR)
}

pub fn global_user_paths() -> Vec<PathBuf> {
    let mut paths = vec![global_codra_dir().join("USER.md")];
    let root_fallback = PathBuf::from("/root/USER.md");
    if !paths.contains(&root_fallback) {
        paths.push(root_fallback);
    }
    paths
}

pub fn global_memory_paths() -> Vec<PathBuf> {
    let mut paths = vec![global_codra_dir().join("MEMORY.md")];
    let root_fallback = PathBuf::from("/root/MEMORY.md");
    if !paths.contains(&root_fallback) {
        paths.push(root_fallback);
    }
    paths
}

pub fn workspace_codra_dir(project_path: &Path) -> PathBuf {
    project_path.join(WORKSPACE_MEMORY_DIR)
}

pub fn workspace_memory_file(project_path: &Path) -> PathBuf {
    workspace_codra_dir(project_path).join("MEMORY.md")
}

pub fn workspace_checkpoint_file(project_path: &Path) -> PathBuf {
    workspace_codra_dir(project_path).join("checkpoint.md")
}

pub fn workspace_notes_file(project_path: &Path) -> PathBuf {
    workspace_codra_dir(project_path).join("notes.md")
}

pub fn task_dir(project_path: &Path, task_id: &str) -> PathBuf {
    workspace_codra_dir(project_path)
        .join("tasks")
        .join(task_id)
}

pub fn task_progress_file(project_path: &Path, task_id: &str) -> PathBuf {
    task_dir(project_path, task_id).join("progress.md")
}

pub fn task_plan_file(project_path: &Path, task_id: &str) -> PathBuf {
    task_dir(project_path, task_id).join("plan.md")
}

pub fn task_decisions_file(project_path: &Path, task_id: &str) -> PathBuf {
    task_dir(project_path, task_id).join("decisions.md")
}

pub fn project_status_files(scope: &MemoryScope) -> Vec<(String, PathBuf)> {
    let root = &scope.project_path;
    let mut files = vec![
        ("MEMORY.md".to_string(), workspace_memory_file(root)),
        (
            "checkpoint.md".to_string(),
            workspace_checkpoint_file(root),
        ),
        ("notes.md".to_string(), workspace_notes_file(root)),
    ];

    if let Some(task_id) = &scope.task_id {
        files.push((
            format!("tasks/{task_id}/progress.md"),
            task_progress_file(root, task_id),
        ));
        files.push((
            format!("tasks/{task_id}/plan.md"),
            task_plan_file(root, task_id),
        ));
        files.push((
            format!("tasks/{task_id}/decisions.md"),
            task_decisions_file(root, task_id),
        ));
    }

    files
}

pub fn global_status_files() -> Vec<(String, PathBuf)> {
    vec![
        ("USER.md".to_string(), global_codra_dir().join("USER.md")),
        (
            "MEMORY.md".to_string(),
            global_codra_dir().join("MEMORY.md"),
        ),
        (
            "/root/USER.md (fallback)".to_string(),
            PathBuf::from("/root/USER.md"),
        ),
        (
            "/root/MEMORY.md (fallback)".to_string(),
            PathBuf::from("/root/MEMORY.md"),
        ),
    ]
}

pub fn recall_search_paths(scope: &MemoryScope) -> Vec<PathBuf> {
    let root = &scope.project_path;
    let mut paths = Vec::new();

    for candidate in global_user_paths()
        .into_iter()
        .chain(global_memory_paths())
    {
        paths.push(candidate);
    }

    paths.push(workspace_memory_file(root));
    paths.push(workspace_checkpoint_file(root));
    paths.push(workspace_notes_file(root));

    if let Some(task_id) = &scope.task_id {
        paths.push(task_progress_file(root, task_id));
        paths.push(task_plan_file(root, task_id));
        paths.push(task_decisions_file(root, task_id));
    }

    paths
}