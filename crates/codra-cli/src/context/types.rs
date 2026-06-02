use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum GitHubContextMode {
    Local,
    #[serde(rename = "github-actions")]
    GitHubActions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodraChangedFile {
    pub filename: String,
    pub status: String,
    pub additions: u32,
    pub deletions: u32,
    pub changes: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub patch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodraIssueComment {
    pub author: String,
    pub body: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodraPullRequestContext {
    pub number: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub changed_files: Option<Vec<CodraChangedFile>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diff_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodraIssueContext {
    pub number: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comments: Option<Vec<CodraIssueComment>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodraCheckSummary {
    pub name: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conclusion: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalGitContext {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub root: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub branch: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_short: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recent_commits: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodraGitHubContext {
    pub available: bool,
    pub mode: GitHubContextMode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sha: Option<String>,
    #[serde(rename = "ref", skip_serializing_if = "Option::is_none")]
    pub ref_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pull_request: Option<CodraPullRequestContext>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue: Option<CodraIssueContext>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checks: Option<Vec<CodraCheckSummary>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local_git: Option<LocalGitContext>,
    pub warnings: Vec<String>,
}