use std::env;
use std::fs;
use std::time::Duration;

use reqwest::blocking::Client;
use serde_json::Value;

use crate::utils::safe_error::redact_secrets;

use super::types::{
    CodraChangedFile, CodraCheckSummary, CodraGitHubContext, CodraIssueComment, CodraIssueContext,
    CodraPullRequestContext, GitHubContextMode,
};
use super::local_git::load_local_git;

/// True only when running in a real GitHub Actions job (`GITHUB_ACTIONS=true`).
pub fn github_actions_runtime_enabled() -> bool {
    env::var("GITHUB_ACTIONS").ok().as_deref() == Some("true")
}

const API_TIMEOUT_SECS: u64 = 15;
const MAX_CHANGED_FILES: usize = 100;
const MAX_PATCH_LEN: usize = 32_000;

pub fn load_github_context() -> CodraGitHubContext {
    let mut ctx = CodraGitHubContext {
        available: false,
        mode: GitHubContextMode::Local,
        repository: env::var("GITHUB_REPOSITORY").ok(),
        owner: None,
        repo: None,
        event_name: env::var("GITHUB_EVENT_NAME").ok(),
        event_path: env::var("GITHUB_EVENT_PATH").ok(),
        sha: env::var("GITHUB_SHA").ok(),
        ref_name: env::var("GITHUB_REF").ok(),
        base_ref: env::var("GITHUB_BASE_REF").ok(),
        head_ref: env::var("GITHUB_HEAD_REF").ok(),
        pull_request: None,
        issue: None,
        checks: None,
        local_git: None,
        warnings: Vec::new(),
    };

    if let Some(ref full_repo) = ctx.repository {
        let parts: Vec<&str> = full_repo.splitn(2, '/').collect();
        if parts.len() == 2 {
            ctx.owner = Some(parts[0].to_string());
            ctx.repo = Some(parts[1].to_string());
        }
    }

    let in_actions = github_actions_runtime_enabled();

    if in_actions {
        ctx.mode = GitHubContextMode::GitHubActions;
        parse_event_payload(&mut ctx);
        ctx.available = ctx.pull_request.is_some() || ctx.issue.is_some();
    } else {
        ctx.warnings
            .push("not running inside GitHub Actions; GitHub event context unavailable".to_string());
        if ctx.event_path.is_some() {
            ctx.warnings.push(
                "GITHUB_EVENT_PATH detected outside GitHub Actions; treating as local fixture context."
                    .to_string(),
            );
            parse_event_payload(&mut ctx);
            if ctx.pull_request.is_some() || ctx.issue.is_some() {
                ctx.available = true;
            }
        }
    }

    let token = env::var("GITHUB_TOKEN").ok().filter(|t| !t.is_empty());
    if token.is_none() {
        ctx.warnings
            .push("GITHUB_TOKEN not set; skipping GitHub API enrichment".to_string());
    } else if let (Some(owner), Some(repo)) = (ctx.owner.clone(), ctx.repo.clone()) {
        enrich_from_api(&mut ctx, &owner, &repo, token.as_deref().unwrap());
    }

    let (local_git, git_warnings) = load_local_git();
    ctx.local_git = Some(local_git);
    ctx.warnings.extend(git_warnings);

    if !in_actions && ctx.pull_request.is_none() && ctx.issue.is_none() {
        if ctx.local_git.as_ref().and_then(|g| g.root.as_ref()).is_some() {
            ctx.available = true;
        }
    }

    ctx
}

fn parse_event_payload(ctx: &mut CodraGitHubContext) {
    let path = match &ctx.event_path {
        Some(p) => p.clone(),
        None => {
            ctx.warnings
                .push("GITHUB_EVENT_PATH not set; cannot read event payload".to_string());
            return;
        }
    };

    let raw = match fs::read_to_string(&path) {
        Ok(s) => s,
        Err(e) => {
            ctx.warnings.push(redact_secrets(&format!(
                "failed to read GITHUB_EVENT_PATH: {e}"
            )));
            return;
        }
    };

    let event_name = ctx.event_name.clone().unwrap_or_default();
    parse_event_payload_from_str(ctx, &event_name, &raw);
}

pub fn parse_event_payload_from_str(
    ctx: &mut CodraGitHubContext,
    event_name: &str,
    raw: &str,
) {
    let payload: Value = match serde_json::from_str(raw) {
        Ok(v) => v,
        Err(e) => {
            ctx.warnings
                .push(format!("failed to parse GitHub event payload: {e}"));
            return;
        }
    };

    match event_name {
        "pull_request" => parse_pull_request_event(ctx, &payload),
        "issues" => {
            if let Some(issue) = payload.get("issue") {
                merge_issue(ctx, issue);
            } else {
                ctx.warnings
                    .push("issues event missing issue object".to_string());
            }
        }
        "issue_comment" => {
            if let Some(issue) = payload.get("issue") {
                merge_issue(ctx, issue);
            } else {
                ctx.warnings
                    .push("issue_comment event missing issue object".to_string());
            }
        }
        other if !other.is_empty() => {
            ctx.warnings
                .push(format!("unsupported GitHub event for context: {other}"));
        }
        _ => {}
    }
}

fn parse_pull_request_event(ctx: &mut CodraGitHubContext, payload: &Value) {
    let pr = match payload.get("pull_request") {
        Some(pr) => pr,
        None => {
            ctx.warnings
                .push("pull_request event missing pull_request object".to_string());
            return;
        }
    };

    let number = pr.get("number").and_then(|v| v.as_u64()).unwrap_or(0);
    if number == 0 {
        ctx.warnings.push("pull_request number missing in event".to_string());
        return;
    }

    ctx.pull_request = Some(CodraPullRequestContext {
        number,
        title: pr.get("title").and_then(|v| v.as_str()).map(str::to_string),
        body: pr.get("body").and_then(|v| v.as_str()).map(str::to_string),
        base_ref: pr
            .get("base")
            .and_then(|b| b.get("ref"))
            .and_then(|v| v.as_str())
            .map(str::to_string)
            .or_else(|| ctx.base_ref.clone()),
        head_ref: pr
            .get("head")
            .and_then(|h| h.get("ref"))
            .and_then(|v| v.as_str())
            .map(str::to_string)
            .or_else(|| ctx.head_ref.clone()),
        author: pr
            .get("user")
            .and_then(|u| u.get("login"))
            .and_then(|v| v.as_str())
            .map(str::to_string),
        changed_files: None,
        diff_text: None,
    });
    ctx.available = true;
}

fn merge_issue(ctx: &mut CodraGitHubContext, issue: &Value) {
    let number = issue.get("number").and_then(|v| v.as_u64()).unwrap_or(0);
    if number == 0 {
        return;
    }
    ctx.issue = Some(CodraIssueContext {
        number,
        title: issue.get("title").and_then(|v| v.as_str()).map(str::to_string),
        body: issue.get("body").and_then(|v| v.as_str()).map(str::to_string),
        author: issue
            .get("user")
            .and_then(|u| u.get("login"))
            .and_then(|v| v.as_str())
            .map(str::to_string),
        comments: None,
    });
    ctx.available = true;
}

fn enrich_from_api(ctx: &mut CodraGitHubContext, owner: &str, repo: &str, token: &str) {
    let client = match Client::builder()
        .timeout(Duration::from_secs(API_TIMEOUT_SECS))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            ctx.warnings
                .push(redact_secrets(&format!("GitHub API client error: {e}")));
            return;
        }
    };

    if let Some(number) = ctx.pull_request.as_ref().map(|p| p.number) {
        enrich_pull_request(&client, ctx, owner, repo, token, number);
    }

    if let Some(number) = ctx.issue.as_ref().map(|i| i.number) {
        enrich_issue(&client, ctx, owner, repo, token, number);
    }
}

fn enrich_pull_request(
    client: &Client,
    ctx: &mut CodraGitHubContext,
    owner: &str,
    repo: &str,
    token: &str,
    number: u64,
) {
    let base = format!("https://api.github.com/repos/{owner}/{repo}");
    let pr_url = format!("{base}/pulls/{number}");

    if let Ok(resp) = github_get(client, &pr_url, token) {
        if let Some(pr) = &mut ctx.pull_request {
            pr.title = resp
                .get("title")
                .and_then(|v| v.as_str())
                .map(str::to_string)
                .or(pr.title.clone());
            pr.body = resp
                .get("body")
                .and_then(|v| v.as_str())
                .map(str::to_string)
                .or(pr.body.clone());
        }
    } else {
        ctx.warnings
            .push("GitHub API: failed to fetch pull request details".to_string());
    }

    let files_url = format!("{base}/pulls/{number}/files?per_page={MAX_CHANGED_FILES}");
    if let Ok(files) = github_get(client, &files_url, token) {
        if let Some(arr) = files.as_array() {
            let changed: Vec<CodraChangedFile> = arr
                .iter()
                .filter_map(|f| {
                    Some(CodraChangedFile {
                        filename: f.get("filename")?.as_str()?.to_string(),
                        status: f
                            .get("status")
                            .and_then(|v| v.as_str())
                            .unwrap_or("modified")
                            .to_string(),
                        additions: f.get("additions").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                        deletions: f.get("deletions").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                        changes: f.get("changes").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                        patch: f.get("patch").and_then(|v| v.as_str()).map(truncate_patch),
                    })
                })
                .collect();
            if let Some(pr) = &mut ctx.pull_request {
                pr.changed_files = Some(changed);
            }
        }
    } else {
        ctx.warnings
            .push("GitHub API: failed to fetch pull request changed files".to_string());
    }

    if let Some(diff) = fetch_accept(
        client,
        &format!("{base}/pulls/{number}"),
        token,
        "application/vnd.github.v3.diff",
    ) {
        if let Some(pr) = &mut ctx.pull_request {
            pr.diff_text = Some(truncate_patch(&diff));
        }
    }

    if let Some(sha) = ctx.sha.as_ref().filter(|s| !s.is_empty()) {
        let url = format!("{base}/commits/{sha}/check-runs?per_page=30");
        if let Ok(resp) = github_get(client, &url, token) {
            ctx.checks = parse_check_runs(&resp);
        }
    }
}

fn enrich_issue(
    client: &Client,
    ctx: &mut CodraGitHubContext,
    owner: &str,
    repo: &str,
    token: &str,
    number: u64,
) {
    let url =
        format!("https://api.github.com/repos/{owner}/{repo}/issues/{number}/comments?per_page=50");
    if let Ok(resp) = github_get(client, &url, token) {
        if let Some(arr) = resp.as_array() {
            let comments: Vec<CodraIssueComment> = arr
                .iter()
                .map(|c| CodraIssueComment {
                    author: c
                        .get("user")
                        .and_then(|u| u.get("login"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    body: c.get("body").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    created_at: c
                        .get("created_at")
                        .and_then(|v| v.as_str())
                        .map(str::to_string),
                })
                .collect();
            if let Some(issue) = &mut ctx.issue {
                issue.comments = Some(comments);
            }
        }
    } else {
        ctx.warnings
            .push("GitHub API: failed to fetch issue comments".to_string());
    }
}

fn truncate_patch(p: &str) -> String {
    if p.len() <= MAX_PATCH_LEN {
        p.to_string()
    } else {
        format!("{}… [truncated]", &p[..MAX_PATCH_LEN])
    }
}

fn github_get(client: &Client, url: &str, token: &str) -> Result<Value, ()> {
    let resp = client
        .get(url)
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "codra-cli")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .map_err(|_| ())?;

    if !resp.status().is_success() {
        return Err(());
    }
    resp.json().map_err(|_| ())
}

fn fetch_accept(client: &Client, url: &str, token: &str, accept: &str) -> Option<String> {
    let resp = client
        .get(url)
        .header("Accept", accept)
        .header("User-Agent", "codra-cli")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .ok()?;
    if !resp.status().is_success() {
        return None;
    }
    resp.text().ok()
}

fn parse_check_runs(resp: &Value) -> Option<Vec<CodraCheckSummary>> {
    let runs = resp.get("check_runs")?.as_array()?;
    Some(
        runs.iter()
            .filter_map(|r| {
                Some(CodraCheckSummary {
                    name: r.get("name").and_then(|v| v.as_str())?.to_string(),
                    status: r
                        .get("status")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    conclusion: r
                        .get("conclusion")
                        .and_then(|v| v.as_str())
                        .map(str::to_string),
                    details_url: r
                        .get("details_url")
                        .and_then(|v| v.as_str())
                        .map(str::to_string),
                })
            })
            .collect(),
    )
}