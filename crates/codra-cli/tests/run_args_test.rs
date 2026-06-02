use codra_cli::{parse_run_args, peek_task_label, VALID_TASKS};

#[test]
fn parses_task_and_jsonl_flag() {
    let args = vec![
        "--task".to_string(),
        "review-pr".to_string(),
        "--jsonl".to_string(),
    ];
    let opts = parse_run_args(&args).unwrap();
    assert_eq!(opts.task, "review-pr");
    assert!(opts.jsonl);
}

#[test]
fn rejects_invalid_task() {
    let args = vec!["--task".to_string(), "not-a-task".to_string()];
    let err = parse_run_args(&args).unwrap_err();
    assert!(err.contains("invalid task"));
    for t in VALID_TASKS {
        assert!(err.contains(t));
    }
}

#[test]
fn peek_task_label_unknown_when_missing() {
    assert_eq!(peek_task_label(&[]), "unknown");
}

#[test]
fn peek_task_label_reads_invalid_task_name() {
    let args = vec!["--task".to_string(), "not-a-task".to_string(), "--jsonl".to_string()];
    assert_eq!(peek_task_label(&args), "not-a-task");
}