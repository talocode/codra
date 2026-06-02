use std::process::Command;

use codra_cli::execute_run;

fn codra_bin() -> String {
    std::env::var("CARGO_BIN_EXE_codra").expect("CARGO_BIN_EXE_codra must be set for integration tests")
}

#[test]
fn invalid_task_jsonl_emits_run_failed() {
    let args = vec![
        "--task".to_string(),
        "not-a-real-task".to_string(),
        "--jsonl".to_string(),
    ];
    let err = execute_run(&args).unwrap_err();
    assert!(err.contains("invalid task"));

    let output = Command::new(codra_bin())
        .args(["run", "--task", "not-a-real-task", "--jsonl"])
        .output()
        .expect("run codra binary");
    assert!(!output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("\"type\":\"codra.run.failed\"") || stdout.contains("codra.run.failed"));
    assert!(stdout.contains("argument_validation"));
    assert!(stdout.contains("not-a-real-task"));
    assert!(stdout.contains("secretsExposed"));
    let combined = format!(
        "{}{}",
        stdout,
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(!combined.contains("ghp_"));
    assert!(!combined.to_lowercase().contains("authorization: bearer"));
}

#[test]
fn invalid_task_without_jsonl_is_human_readable() {
    let output = Command::new(codra_bin())
        .args(["run", "--task", "not-a-real-task"])
        .output()
        .expect("run codra binary");
    assert!(!output.status.success());
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("codra:"));
    assert!(stderr.contains("invalid task"));
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(!stdout.contains("codra.run.failed"));
}

#[test]
fn invalid_task_jsonl_never_prints_token() {
    let output = Command::new(codra_bin())
        .env("GITHUB_TOKEN", "ghp_test_secret_value")
        .args(["run", "--task", "bad", "--jsonl"])
        .output()
        .expect("run codra binary");
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(!combined.contains("ghp_test_secret_value"));
}