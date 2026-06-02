use serde_json::{json, Value};

use crate::context::CodraGitHubContext;
use crate::events::EventEmitter;

pub fn run(emitter: &EventEmitter, ctx: &CodraGitHubContext) -> Result<Value, String> {
    let summary = if let Some(issue) = &ctx.issue {
        let comment_count = issue.comments.as_ref().map(|c| c.len()).unwrap_or(0);
        let title = issue.title.as_deref().unwrap_or("(no title)");
        let body_preview = issue
            .body
            .as_deref()
            .unwrap_or("")
            .chars()
            .take(500)
            .collect::<String>();

        json!({
            "overview": format!(
                "Issue #{}: {title}\nAuthor: {}\nComments: {comment_count}\n\n{body_preview}",
                issue.number,
                issue.author.as_deref().unwrap_or("unknown")
            ),
            "changedFiles": [],
            "riskAreas": if comment_count > 10 {
                vec![format!("High discussion volume ({comment_count} comments)")]
            } else {
                vec![]
            },
            "nextSuggestedSteps": [
                "Triage labels and reproduction steps",
                "Link related PRs if any",
                "Phase 3: post explanation as issue comment via Action"
            ]
        })
    } else {
        emitter.warning("no issue context available")?;
        json!({
            "overview": "No GitHub issue context detected. Run in issues or issue_comment workflow, or provide event fixture.",
            "changedFiles": [],
            "riskAreas": [],
            "nextSuggestedSteps": ["Set GITHUB_EVENT_NAME=issues and GITHUB_EVENT_PATH for local testing"]
        })
    };

    emitter.emit("codra.task.summary", summary.clone())?;
    Ok(summary)
}