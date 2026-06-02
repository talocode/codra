use std::process::Command;

use super::types::LocalGitContext;

pub fn load_local_git() -> (LocalGitContext, Vec<String>) {
    let mut warnings = Vec::new();
    if Command::new("git").arg("--version").output().is_err() {
        warnings.push("git is not available; skipping local git metadata".to_string());
        return (LocalGitContext::default(), warnings);
    }

    let root = run_git(&["rev-parse", "--show-toplevel"]);
    let branch = run_git(&["branch", "--show-current"]);
    let status_short = run_git(&["status", "--short"]);
    let log = run_git(&["log", "--oneline", "-5"]);

    if root.is_none() {
        warnings.push("not inside a git repository".to_string());
    }

    let recent_commits = log.map(|s| {
        s.lines()
            .filter(|l| !l.is_empty())
            .map(String::from)
            .collect::<Vec<_>>()
    });

    (
        LocalGitContext {
            root,
            branch,
            status_short,
            recent_commits,
        },
        warnings,
    )
}

fn run_git(args: &[&str]) -> Option<String> {
    let output = Command::new("git").args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

impl Default for LocalGitContext {
    fn default() -> Self {
        Self {
            root: None,
            branch: None,
            status_short: None,
            recent_commits: None,
        }
    }
}