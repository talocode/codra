use codra_deploy::{
    execute_up_with_executor, generate_plan, run_post_deploy_verification, validate_config,
    AgentBrowserCommandOutput, DeployConfig, MockAgentBrowserExecutor, MISSING_VERIFY_URL_WARNING,
};
use std::collections::HashMap;

fn config_with_verify(url: Option<&str>, allow_warnings: bool) -> DeployConfig {
    let url_field = match url {
        Some(value) => format!(r#""url": "{value}","#),
        None => String::new(),
    };

    serde_json::from_str(&format!(
        r#"{{
            "version": 1,
            "project": "verify-app",
            "services": [
                {{
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "ports": [{{ "internal": 3000, "public": true }}],
                    "verify": {{
                        "enabled": true,
                        {url_field}
                        "vision": false,
                        "allowWarnings": {allow_warnings},
                        "screenshotOut": "agent-browser-screenshot.png"
                    }}
                }}
            ]
        }}"#
    ))
    .unwrap()
}

fn sample_result_json(status: &str, summary: &str) -> String {
    format!(
        r#"{{
            "ok": true,
            "result": {{
                "protocolVersion": "1.0",
                "url": "https://example.com",
                "status": "{status}",
                "summary": "{summary}",
                "checks": [
                    {{
                        "id": "page_load",
                        "status": "{status}",
                        "message": "Page loaded."
                    }}
                ],
                "vision": {{ "enabled": false, "warnings": [] }}
            }}
        }}"#
    )
}

#[test]
fn config_with_verify_block_parses() {
    let config = config_with_verify(Some("https://example.com"), false);
    let verify = config.services[0].verify.as_ref().unwrap();
    assert!(verify.enabled);
    assert_eq!(verify.url.as_deref(), Some("https://example.com"));
    assert!(!verify.allow_warnings);
    assert_eq!(
        verify.screenshot_out.as_deref(),
        Some("agent-browser-screenshot.png")
    );
}

#[test]
fn existing_config_without_verify_still_passes() {
    let config: DeployConfig = serde_json::from_str(
        r#"{
            "version": 1,
            "project": "legacy-app",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "ports": [{ "internal": 3000, "public": true }]
                }
            ]
        }"#,
    )
    .unwrap();

    let result = validate_config(&config);
    assert!(result.valid);
    assert!(config.services[0].verify.is_none());
}

#[test]
fn deploy_plan_includes_verify_info() {
    let plan = generate_plan(&config_with_verify(Some("https://example.com"), true));
    let verify = plan.services[0].verify.as_ref().unwrap();
    assert!(verify.enabled);
    assert_eq!(verify.url.as_deref(), Some("https://example.com"));
    assert!(!verify.vision);
    assert!(verify.allow_warnings);
}

#[test]
fn post_verify_skips_when_url_missing() {
    let config = config_with_verify(None, false);
    let executor = MockAgentBrowserExecutor::new(HashMap::new());

    let result = run_post_deploy_verification(&config, None, false, &executor);
    assert!(result.is_ok());
    assert!(executor.calls().is_empty());
}

#[test]
fn post_verify_runs_when_configured() {
    let config = config_with_verify(Some("https://example.com"), false);
    let key = "agent-browser --json check https://example.com --screenshot-out agent-browser-screenshot.png"
        .to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key,
        Ok(AgentBrowserCommandOutput {
            status: 0,
            stdout: sample_result_json("pass", "Smoke check passed."),
            stderr: String::new(),
        }),
    );

    let executor = MockAgentBrowserExecutor::new(responses);
    let result = run_post_deploy_verification(&config, None, false, &executor);
    assert!(result.is_ok());
    assert_eq!(executor.calls().len(), 1);
}

#[test]
fn post_verify_failure_returns_non_zero() {
    let config = config_with_verify(Some("https://example.com"), false);
    let key = "agent-browser --json check https://example.com --screenshot-out agent-browser-screenshot.png"
        .to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key,
        Ok(AgentBrowserCommandOutput {
            status: 0,
            stdout: sample_result_json("fail", "Smoke check failed."),
            stderr: String::new(),
        }),
    );

    let executor = MockAgentBrowserExecutor::new(responses);
    let result = run_post_deploy_verification(&config, None, false, &executor);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("verification failed"));
}

#[test]
fn post_verify_respects_allow_warnings() {
    let config = config_with_verify(Some("https://example.com"), true);
    let key = "agent-browser --json check https://example.com --screenshot-out agent-browser-screenshot.png"
        .to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key,
        Ok(AgentBrowserCommandOutput {
            status: 0,
            stdout: sample_result_json("warn", "Smoke check passed with warnings."),
            stderr: String::new(),
        }),
    );

    let executor = MockAgentBrowserExecutor::new(responses);
    let result = run_post_deploy_verification(&config, None, false, &executor);
    assert!(result.is_ok());
}

#[test]
fn deploy_up_without_verify_does_not_call_agent_browser() {
    let dir = std::env::temp_dir().join(format!(
        "codra-post-verify-no-flag-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let config_path = dir.join("codra.deploy.json");
    std::fs::write(
        &config_path,
        serde_json::to_string(&config_with_verify(Some("https://example.com"), false)).unwrap(),
    )
    .unwrap();

    let executor = MockAgentBrowserExecutor::new(HashMap::new());
    let result = execute_up_with_executor(
        &[
            "--config".to_string(),
            config_path.display().to_string(),
            "--dry-run".to_string(),
        ],
        &executor,
    );

    assert!(result.is_ok());
    assert!(executor.calls().is_empty());
}

#[test]
fn deploy_up_with_verify_runs_configured_verification() {
    let dir = std::env::temp_dir().join(format!(
        "codra-post-verify-with-flag-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let config_path = dir.join("codra.deploy.json");
    std::fs::write(
        &config_path,
        serde_json::to_string(&config_with_verify(Some("https://example.com"), false)).unwrap(),
    )
    .unwrap();

    let key = "agent-browser --json check https://example.com --screenshot-out agent-browser-screenshot.png"
        .to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key,
        Ok(AgentBrowserCommandOutput {
            status: 0,
            stdout: sample_result_json("pass", "Smoke check passed."),
            stderr: String::new(),
        }),
    );

    let executor = MockAgentBrowserExecutor::new(responses);
    let result = execute_up_with_executor(
        &[
            "--config".to_string(),
            config_path.display().to_string(),
            "--dry-run".to_string(),
            "--verify".to_string(),
            "--service".to_string(),
            "web".to_string(),
        ],
        &executor,
    );

    assert!(result.is_ok());
    assert_eq!(executor.calls().len(), 1);
}

#[test]
fn missing_verify_url_warning_constant_matches_spec() {
    assert_eq!(
        MISSING_VERIFY_URL_WARNING,
        "No verification URL configured. Skipping post-deploy verification."
    );
}