use codra_cli::parse_run_args;
use codra_cli::VALID_TASKS;

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