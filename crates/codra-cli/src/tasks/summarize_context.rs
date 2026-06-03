use std::{env, path::PathBuf};

use serde_json::{json, Value};

use crate::context::CodraGitHubContext;
use crate::events::EventEmitter;

pub fn run(emitter: &EventEmitter, ctx: &CodraGitHubContext) -> Result<Value, String> {
    let mode = serde_json::to_value(&ctx.mode).unwrap_or(json!("local"));
    let root = ctx
        .local_git
        .as_ref()
        .and_then(|git| git.root.as_ref())
        .map(PathBuf::from)
        .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let codra_md_exists = root.join("CODRA.md").exists();
    let summary = json!({
        "overview": format!(
            "Context mode: {mode}\nAvailable: {}\nRepository: {}\nEvent: {}\nCODRA.md: {}",
            ctx.available,
            ctx.repository.as_deref().unwrap_or("n/a"),
            ctx.event_name.as_deref().unwrap_or("n/a"),
            if codra_md_exists { "present" } else { "missing" }
        ),
        "changedFiles": [],
        "riskAreas": [],
        "nextSuggestedSteps": ["Use --jsonl for machine-readable full context in data field"],
        "context": ctx
    });

    emitter.emit(
        "codra.task.summary",
        json!({
            "overview": summary.get("overview"),
            "changedFiles": [],
            "riskAreas": [],
            "nextSuggestedSteps": summary.get("nextSuggestedSteps"),
            "detected": {
                "mode": mode,
                "available": ctx.available,
                "hasPullRequest": ctx.pull_request.is_some(),
                "hasIssue": ctx.issue.is_some(),
                "warningCount": ctx.warnings.len(),
                "localGitRoot": ctx.local_git.as_ref().and_then(|g| g.root.clone()),
                "codraMdExists": codra_md_exists
            }
        }),
    )?;
    Ok(summary)
}
