use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use codra_cli::context::github::github_actions_runtime_enabled;
use codra_cli::context::load_github_context;
use codra_cli::context::types::GitHubContextMode;

static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn env_lock() -> std::sync::MutexGuard<'static, ()> {
    ENV_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .unwrap_or_else(|e| e.into_inner())
}

fn fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/pull_request_event.json")
}

fn clear_github_env() {
    for key in [
        "GITHUB_ACTIONS",
        "GITHUB_EVENT_PATH",
        "GITHUB_EVENT_NAME",
        "GITHUB_REPOSITORY",
        "GITHUB_TOKEN",
    ] {
        std::env::remove_var(key);
    }
}

#[test]
fn github_actions_detection_helper() {
    let _lock = env_lock();
    clear_github_env();
    assert!(!github_actions_runtime_enabled());

    std::env::set_var("GITHUB_ACTIONS", "true");
    assert!(github_actions_runtime_enabled());

    std::env::set_var("GITHUB_ACTIONS", "false");
    assert!(!github_actions_runtime_enabled());

    std::env::set_var("GITHUB_EVENT_PATH", "/tmp/event.json");
    assert!(!github_actions_runtime_enabled());
    clear_github_env();
}

#[test]
fn event_path_alone_does_not_set_github_actions_mode() {
    let _lock = env_lock();
    clear_github_env();
    std::env::set_var(
        "GITHUB_EVENT_PATH",
        fixture_path().to_str().expect("fixture path utf-8"),
    );
    std::env::set_var("GITHUB_EVENT_NAME", "pull_request");

    let ctx = load_github_context();
    assert_eq!(ctx.mode, GitHubContextMode::Local);
    assert!(ctx.pull_request.is_some());
    assert!(ctx.warnings.iter().any(|w| {
        w.contains("GITHUB_EVENT_PATH detected outside GitHub Actions")
    }));

    clear_github_env();
}

#[test]
fn github_actions_true_with_event_path_sets_actions_mode() {
    let _lock = env_lock();
    clear_github_env();
    std::env::set_var("GITHUB_ACTIONS", "true");
    std::env::set_var(
        "GITHUB_EVENT_PATH",
        fixture_path().to_str().expect("fixture path utf-8"),
    );
    std::env::set_var("GITHUB_EVENT_NAME", "pull_request");

    let ctx = load_github_context();
    assert_eq!(ctx.mode, GitHubContextMode::GitHubActions);
    assert!(ctx.pull_request.is_some());
    assert!(!ctx.warnings.iter().any(|w| {
        w.contains("GITHUB_EVENT_PATH detected outside GitHub Actions")
    }));

    clear_github_env();
}

#[test]
fn outputs_never_contain_github_token_value() {
    let _lock = env_lock();
    clear_github_env();
    std::env::set_var("GITHUB_TOKEN", "ghp_super_secret_token_value");
    let ctx = load_github_context();
    let blob = format!("{ctx:?}");
    assert!(!blob.contains("ghp_super_secret_token_value"));
    clear_github_env();
}