use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

use codra_cli::memory::execute_memory_command;

fn temp_workspace() -> std::path::PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("codra-cli-memory-{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn cli_memory_status_smoke() {
    let dir = temp_workspace();
    let codra = dir.join(".codra");
    fs::create_dir_all(&codra).unwrap();
    fs::write(codra.join("MEMORY.md"), "# Project memory\n").unwrap();

    let original = std::env::current_dir().unwrap();
    std::env::set_current_dir(&dir).unwrap();

    let result = execute_memory_command(&["status".to_string()]);
    std::env::set_current_dir(original).unwrap();

    assert!(result.is_ok());
}

#[test]
fn cli_memory_context_with_query() {
    let dir = temp_workspace();
    let codra = dir.join(".codra");
    fs::create_dir_all(&codra).unwrap();
    fs::write(
        codra.join("MEMORY.md"),
        "Codra deploy architecture uses registry pattern\n",
    )
    .unwrap();

    let original = std::env::current_dir().unwrap();
    std::env::set_current_dir(&dir).unwrap();

    let result = execute_memory_command(&[
        "context".to_string(),
        "--query".to_string(),
        "deploy architecture".to_string(),
        "--budget".to_string(),
        "4000".to_string(),
    ]);
    std::env::set_current_dir(original).unwrap();

    assert!(result.is_ok());
}

#[test]
fn cli_memory_unknown_subcommand_errors() {
    let result = execute_memory_command(&["archive".to_string()]);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("unknown memory subcommand"));
}