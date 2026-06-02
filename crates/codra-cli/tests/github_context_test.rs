use codra_cli::context::github::parse_event_payload_from_str;
use codra_cli::context::types::{CodraGitHubContext, GitHubContextMode};

#[test]
fn parses_pull_request_fixture() {
    let raw = include_str!("fixtures/pull_request_event.json");
    let mut ctx = CodraGitHubContext {
        available: false,
        mode: GitHubContextMode::Local,
        repository: Some("talocode/codra".to_string()),
        owner: Some("talocode".to_string()),
        repo: Some("codra".to_string()),
        event_name: None,
        event_path: None,
        sha: None,
        ref_name: None,
        base_ref: Some("main".to_string()),
        head_ref: Some("feat/example".to_string()),
        pull_request: None,
        issue: None,
        checks: None,
        local_git: None,
        warnings: Vec::new(),
    };

    parse_event_payload_from_str(&mut ctx, "pull_request", raw);

    let pr = ctx.pull_request.expect("pull request context");
    assert_eq!(pr.number, 42);
    assert_eq!(pr.title.as_deref(), Some("feat: example PR"));
    assert_eq!(pr.author.as_deref(), Some("octocat"));
    assert!(ctx.available);
    assert_eq!(ctx.mode, GitHubContextMode::Local);
}

#[test]
fn no_token_does_not_panic() {
    let ctx = codra_cli::context::load_github_context();
    assert!(!ctx.warnings.iter().any(|w| w.contains("ghp_")));
}