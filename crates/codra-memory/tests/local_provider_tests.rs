use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use codra_memory::{
    LocalMarkdownMemoryProvider, MemoryContextQuery, MemoryProvider, MemoryScope,
};

fn temp_workspace() -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("codra-memory-it-{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn global_fallback_user_md_is_read_when_present() {
    let root = temp_workspace();
    let fallback = PathBuf::from("/root/USER.md");
    let had_fallback = fallback.exists();
    let prior = if had_fallback {
        Some(fs::read_to_string(&fallback).unwrap())
    } else {
        None
    };

    fs::create_dir_all("/root").ok();
    fs::write(&fallback, "- Abdulmuiz prefers practical examples\n").unwrap();

    let provider = LocalMarkdownMemoryProvider::new();
    let scope = MemoryScope::new(root);
    let profile = provider.profile(&scope).unwrap();

    assert!(profile
        .static_facts
        .iter()
        .any(|f| f.contains("practical examples")));

    if let Some(content) = prior {
        fs::write(&fallback, content).unwrap();
    } else if fallback.exists() {
        fs::remove_file(&fallback).ok();
    }
}

#[test]
fn secrets_are_filtered_from_recall() {
    let root = temp_workspace();
    let codra = root.join(".codra");
    fs::create_dir_all(&codra).unwrap();
    fs::write(
        codra.join("MEMORY.md"),
        "Deploy notes\napi_key=super-secret-value\narchitecture details\n",
    )
    .unwrap();

    let provider = LocalMarkdownMemoryProvider::new();
    let scope = MemoryScope::new(root);
    let results = provider.recall("architecture", &scope).unwrap();

    assert!(!results.is_empty());
    for result in &results {
        assert!(!result.content.contains("api_key="));
        assert!(!result.content.contains("super-secret-value"));
    }
}

#[test]
fn task_scope_without_task_id_skips_task_sections() {
    let root = temp_workspace();
    let task_path = root.join(".codra/tasks/task-1");
    fs::create_dir_all(&task_path).unwrap();
    fs::write(task_path.join("progress.md"), "Should not load without task_id\n").unwrap();

    let provider = LocalMarkdownMemoryProvider::new();
    let scope = MemoryScope::new(root);
    let bundle = provider
        .context(MemoryContextQuery {
            scope,
            ..Default::default()
        })
        .unwrap();

    assert!(bundle
        .sections
        .iter()
        .all(|s| !s.name.starts_with("task_")));
}