use std::env;

use serde_json::json;

use crate::context::load_github_context;
use crate::events::EventEmitter;
use crate::tasks;
use crate::utils::ids::new_run_id;

pub const VALID_TASKS: &[&str] = &["review-pr", "explain-issue", "summarize-context"];

#[derive(Debug, Clone)]
pub struct RunOptions {
    pub task: String,
    pub jsonl: bool,
}

pub fn args_want_jsonl(args: &[String]) -> bool {
    args.iter().any(|a| a == "--jsonl")
}

/// Task name from `--task` if present; otherwise `"unknown"`.
pub fn peek_task_label(args: &[String]) -> String {
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--task" {
            return args
                .get(i + 1)
                .cloned()
                .filter(|t| !t.is_empty())
                .unwrap_or_else(|| "unknown".to_string());
        }
        i += 1;
    }
    "unknown".to_string()
}

pub fn emit_argument_validation_failed(task: &str, error: &str) -> Result<(), String> {
    let run_id = new_run_id();
    let safe = crate::utils::safe_error::redact_secrets(error);
    let emitter = EventEmitter::new(run_id, task.to_string(), true);
    emitter.emit(
        "codra.run.failed",
        json!({
            "error": safe,
            "stage": "argument_validation",
            "secretsExposed": false
        }),
    )
}

/// Parse and run a task, emitting `codra.run.failed` for JSONL argument validation errors.
pub fn execute_run(args: &[String]) -> Result<(), String> {
    let jsonl = args_want_jsonl(args);
    let task_label = peek_task_label(args);

    match parse_run_args(args) {
        Ok(opts) => run_task(opts),
        Err(err) => {
            if jsonl {
                emit_argument_validation_failed(&task_label, &err)?;
            }
            Err(err)
        }
    }
}

pub fn parse_run_args(args: &[String]) -> Result<RunOptions, String> {
    let mut task: Option<String> = None;
    let mut jsonl = false;

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--task" => {
                task = args.get(i + 1).cloned();
                i += 2;
            }
            "--jsonl" => {
                jsonl = true;
                i += 1;
            }
            flag if flag.starts_with("--") => {
                return Err(format!("unknown flag: {flag}"));
            }
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    let task = task.ok_or_else(|| {
        format!(
            "missing --task. Valid tasks: {}",
            VALID_TASKS.join(", ")
        )
    })?;

    if !VALID_TASKS.contains(&task.as_str()) {
        return Err(format!(
            "invalid task '{task}'. Valid tasks: {}",
            VALID_TASKS.join(", ")
        ));
    }

    Ok(RunOptions { task, jsonl })
}

pub fn run_task(opts: RunOptions) -> Result<(), String> {
    let cwd = env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| ".".to_string());
    let run_id = new_run_id();
    let emitter = EventEmitter::new(run_id.clone(), opts.task.clone(), opts.jsonl);

    emitter.emit(
        "codra.run.started",
        json!({ "cwd": cwd, "jsonl": opts.jsonl }),
    )?;

    emitter.emit("codra.context.loading", json!({}))?;

    let ctx = load_github_context();
    for w in &ctx.warnings {
        emitter.warning(w)?;
    }

    emitter.emit(
        "codra.context.loaded",
        json!({
            "available": ctx.available,
            "mode": ctx.mode,
            "repository": ctx.repository,
            "eventName": ctx.event_name,
            "hasPullRequest": ctx.pull_request.is_some(),
            "hasIssue": ctx.issue.is_some()
        }),
    )?;

    emitter.emit("codra.task.started", json!({}))?;

    let result = tasks::run_task_handler(&opts.task, &emitter, &ctx);

    match result {
        Ok(_) => {
            emitter.emit("codra.task.completed", json!({ "success": true }))?;
            emitter.emit("codra.run.completed", json!({ "exitCode": 0 }))?;
            Ok(())
        }
        Err(err) => {
            let safe = crate::utils::safe_error::redact_secrets(&err);
            emitter.emit(
                "codra.run.failed",
                json!({ "message": safe, "exitCode": 1 }),
            )?;
            Err(safe)
        }
    }
}