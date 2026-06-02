use serde_json::{json, Value};

use crate::context::CodraGitHubContext;
use crate::events::EventEmitter;

pub fn run(emitter: &EventEmitter, ctx: &CodraGitHubContext) -> Result<Value, String> {
    let summary = if let Some(pr) = &ctx.pull_request {
        build_pr_summary(pr)
    } else {
        emitter.warning("no pull request context available; using local repo summary")?;
        build_local_summary(ctx)
    };

    emitter.emit("codra.task.summary", summary.clone())?;
    Ok(summary)
}

fn build_pr_summary(pr: &crate::context::types::CodraPullRequestContext) -> Value {
    let title = pr.title.as_deref().unwrap_or("(no title)");
    let file_count = pr.changed_files.as_ref().map(|f| f.len()).unwrap_or(0);
    let (additions, deletions) = pr
        .changed_files
        .as_ref()
        .map(|files| {
            files.iter().fold((0u32, 0u32), |(a, d), f| {
                (a + f.additions, d + f.deletions)
            })
        })
        .unwrap_or((0, 0));

    let changed_files: Vec<String> = pr
        .changed_files
        .as_ref()
        .map(|files| {
            files
                .iter()
                .take(20)
                .map(|f| format!("{} ({})", f.filename, f.status))
                .collect()
        })
        .unwrap_or_default();

    let risk_areas = infer_risk_areas(pr);

    json!({
        "overview": format!(
            "PR #{}: {title}\nChanged files: {file_count} (+{additions}/-{deletions})",
            pr.number
        ),
        "changedFiles": changed_files,
        "riskAreas": risk_areas,
        "nextSuggestedSteps": [
            "Review high-churn files and test coverage",
            "Run local tests against head ref",
            "Phase 3: wire GitHub Action to post this summary as a PR comment"
        ]
    })
}

fn build_local_summary(ctx: &CodraGitHubContext) -> Value {
    let branch = ctx
        .local_git
        .as_ref()
        .and_then(|g| g.branch.as_deref())
        .unwrap_or("unknown");
    let root = ctx
        .local_git
        .as_ref()
        .and_then(|g| g.root.as_deref())
        .unwrap_or("unknown");

    json!({
        "overview": format!("Local repo at {root} on branch {branch} (no PR context)"),
        "changedFiles": [],
        "riskAreas": ["No PR diff available in local mode"],
        "nextSuggestedSteps": [
            "Run inside GitHub Actions with pull_request event for PR review",
            "Or set GITHUB_EVENT_PATH to a fixture for local testing"
        ]
    })
}

fn infer_risk_areas(pr: &crate::context::types::CodraPullRequestContext) -> Vec<String> {
    let mut risks = Vec::new();
    if let Some(files) = &pr.changed_files {
        if files.len() > 30 {
            risks.push(format!("Large change set ({} files)", files.len()));
        }
        for f in files {
            let name = f.filename.to_lowercase();
            if name.contains("cargo.toml")
                || name.contains("package.json")
                || name.contains("pnpm-lock")
                || name.contains("dockerfile")
            {
                risks.push(format!("Dependency or build config touched: {}", f.filename));
            }
            if name.contains("migration") || name.ends_with(".sql") {
                risks.push(format!("Database migration: {}", f.filename));
            }
        }
    }
    if risks.is_empty() {
        risks.push("No elevated risk signals detected (deterministic scan)".to_string());
    }
    risks
}