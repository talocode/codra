use codra_core::command_runner::MockCommandRunner;
use codra_core::command_safety::is_command_allowed;
use codra_core::task_planner::TaskPlanner;
use codra_core::task_store::TaskStore;
use codra_core::task_verifier::TaskVerifier;
use codra_protocol::TaskStatus;
use std::env;
use std::fs;
use tempfile::tempdir;

#[test]
fn test_task_planner_creates_task_and_moves_to_awaiting_approval() {
    let dir = tempdir().unwrap();
    let workspace = dir.path();
    fs::write(workspace.join("Cargo.toml"), "[package]\nname = \"test\"").unwrap();

    let task_store = TaskStore::new(workspace);
    let planner = TaskPlanner::new(task_store);

    let task = planner
        .create_task(workspace.to_str().unwrap(), "Add a new feature", None)
        .unwrap();

    assert_eq!(task.status, TaskStatus::AwaitingApproval);
    assert!(task.plan.is_some());
}

#[test]
fn test_task_planner_rejects_empty_prompt() {
    let dir = tempdir().unwrap();
    let task_store = TaskStore::new(dir.path());
    let planner = TaskPlanner::new(task_store);

    let result = planner.create_task(dir.path().to_str().unwrap(), "", None);
    assert!(result.is_err());
}

#[test]
fn test_command_safety_allows_and_rejects() {
    assert!(is_command_allowed("pnpm build", None).allowed);
    assert!(!is_command_allowed("rm -rf /", None).allowed);
}

#[test]
fn test_task_verifier_with_mock_runner_completes_on_success() {
    let dir = tempdir().unwrap();
    let workspace = dir.path();
    fs::write(workspace.join("Cargo.toml"), "").unwrap();

    let task_store = TaskStore::new(workspace);
    let planner = TaskPlanner::new(task_store.clone());

    let mut task = planner
        .create_task(workspace.to_str().unwrap(), "Fix bug", None)
        .unwrap();

    // Manually approve for test
    task.status = TaskStatus::Approved;
    task_store.save_task(&task).unwrap();

    let mock_runner = MockCommandRunner::new(true);
    let verifier = TaskVerifier::new(task_store, mock_runner);

    let result = verifier.run_verification(&task.id, None).unwrap();
    assert!(result.success);
}