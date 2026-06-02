mod explain_issue;
mod review_pr;
mod summarize_context;

use serde_json::Value;

use crate::context::CodraGitHubContext;
use crate::events::EventEmitter;

pub fn run_task_handler(
    task: &str,
    emitter: &EventEmitter,
    ctx: &CodraGitHubContext,
) -> Result<Value, String> {
    match task {
        "review-pr" => review_pr::run(emitter, ctx),
        "explain-issue" => explain_issue::run(emitter, ctx),
        "summarize-context" => summarize_context::run(emitter, ctx),
        _ => Err(format!("unknown task: {task}")),
    }
}