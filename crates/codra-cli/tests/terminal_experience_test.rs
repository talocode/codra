use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

fn codra_bin() -> String {
    std::env::var("CARGO_BIN_EXE_codra").expect("CARGO_BIN_EXE_codra must be set")
}

fn temp_workspace(name: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time must be available")
        .as_nanos();
    let path = std::env::temp_dir().join(format!("codra-{name}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&path).expect("create temp workspace");
    path
}

#[test]
fn default_command_prints_welcome() {
    let workspace = temp_workspace("welcome");
    let output = Command::new(codra_bin())
        .current_dir(&workspace)
        .output()
        .expect("run codra binary");

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Codra"));
    assert!(stdout.contains("Local-first AI coding agent for your repo."));
    assert!(stdout.contains("codra init"));
    assert!(stdout.contains("codra doctor"));

    fs::remove_dir_all(workspace).ok();
}

#[test]
fn init_creates_project_skeleton() {
    let workspace = temp_workspace("init");
    let output = Command::new(codra_bin())
        .current_dir(&workspace)
        .arg("init")
        .output()
        .expect("run codra init");

    assert!(output.status.success());
    assert!(workspace.join("CODRA.md").is_file());
    assert!(workspace.join(".codra").is_dir());
    assert!(workspace.join(".codra/commands").is_dir());
    assert!(workspace.join(".codra/agents").is_dir());
    assert!(workspace.join(".codra/commands/review-pr.md").is_file());
    assert!(workspace.join(".codra/commands/explain-issue.md").is_file());
    assert!(workspace.join(".codra/agents/code-reviewer.md").is_file());

    fs::remove_dir_all(workspace).ok();
}

#[test]
fn init_does_not_overwrite_existing_codra_md() {
    let workspace = temp_workspace("init-existing");
    let codra_md = workspace.join("CODRA.md");
    fs::write(&codra_md, "keep this").expect("write existing CODRA.md");

    let output = Command::new(codra_bin())
        .current_dir(&workspace)
        .arg("init")
        .output()
        .expect("run codra init");

    assert!(output.status.success());
    assert_eq!(fs::read_to_string(&codra_md).unwrap(), "keep this");
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("exists"));

    fs::remove_dir_all(workspace).ok();
}

#[test]
fn doctor_exits_zero() {
    let workspace = temp_workspace("doctor");
    let output = Command::new(codra_bin())
        .current_dir(&workspace)
        .arg("doctor")
        .output()
        .expect("run codra doctor");

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Codra doctor"));
    assert!(stdout.contains("current directory"));
    assert!(stdout.contains("npm platform key"));

    fs::remove_dir_all(workspace).ok();
}

#[test]
fn run_summarize_context_still_emits_jsonl_events() {
    let workspace = temp_workspace("run");
    let output = Command::new(codra_bin())
        .current_dir(&workspace)
        .args(["run", "--task", "summarize-context", "--jsonl"])
        .output()
        .expect("run summarize-context");

    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("codra.run.started"));
    assert!(stdout.contains("codra.run.completed"));
    assert!(stdout.contains("codraMdExists"));

    fs::remove_dir_all(workspace).ok();
}
