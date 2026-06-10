use codra_deploy::{
    assert_safe_url, build_agent_browser_args, evaluate_verify_outcome, execute_verify_with_executor,
    format_verify_human, parse_agent_browser_response, parse_verify_args, AgentBrowserCommandOutput,
    MockAgentBrowserExecutor, VerifyOptions,
};
use std::collections::HashMap;

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
                "vision": {{
                    "enabled": false,
                    "warnings": []
                }}
            }}
        }}"#
    )
}

#[test]
fn url_safety_rejects_localhost_by_default() {
    let err = assert_safe_url("http://localhost:3000").unwrap_err();
    assert!(err.contains("Localhost is disabled"));
}

#[test]
fn url_safety_allows_public_https() {
    assert_safe_url("https://example.com").unwrap();
}

#[test]
fn url_safety_rejects_private_ipv4() {
    let err = assert_safe_url("http://192.168.1.10").unwrap_err();
    assert!(err.contains("Private or loopback"));
}

#[test]
fn build_agent_browser_args_includes_global_json_flag() {
    let options = VerifyOptions {
        url: "https://example.com".to_string(),
        screenshot_out: Some("shot.png".to_string()),
        vision: true,
        json: true,
        allow_warnings: false,
        agent_browser_bin: "agent-browser".to_string(),
    };

    let args = build_agent_browser_args(&options);
    assert_eq!(
        args,
        vec![
            "--json".to_string(),
            "check".to_string(),
            "https://example.com".to_string(),
            "--screenshot-out".to_string(),
            "shot.png".to_string(),
            "--vision".to_string(),
        ]
    );
}

#[test]
fn parse_agent_browser_response_reads_status_and_summary() {
    let parsed = parse_agent_browser_response(&sample_result_json("pass", "Smoke check passed."))
        .unwrap();
    assert_eq!(parsed.status, "pass");
    assert_eq!(parsed.summary, "Smoke check passed.");
    assert_eq!(parsed.url, "https://example.com");
}

#[test]
fn evaluate_verify_outcome_warn_requires_allow_flag() {
    assert!(evaluate_verify_outcome("pass", "ok", false).is_ok());
    assert!(evaluate_verify_outcome("warn", "warned", false).is_err());
    assert!(evaluate_verify_outcome("warn", "warned", true).is_ok());
    assert!(evaluate_verify_outcome("fail", "failed", true).is_err());
}

#[test]
fn format_verify_human_renders_checks() {
    let parsed = parse_agent_browser_response(&sample_result_json("warn", "Smoke check passed with warnings."))
        .unwrap();
    let rendered = format_verify_human(&parsed, "Codra Deploy Verify");
    assert!(rendered.contains("Codra Deploy Verify"));
    assert!(rendered.contains("Status: WARN"));
    assert!(rendered.contains("[warn] Page loaded."));
}

#[test]
fn execute_verify_with_mock_passes() {
    let key = "agent-browser --json check https://example.com".to_string();
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
    let result = execute_verify_with_executor(
        &["https://example.com".to_string()],
        &executor,
    );

    assert!(result.is_ok());
    assert_eq!(executor.calls().len(), 1);
}

#[test]
fn execute_verify_with_mock_warn_fails_without_allow_warnings() {
    let key = "agent-browser --json check https://example.com".to_string();
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
    let result = execute_verify_with_executor(
        &["https://example.com".to_string()],
        &executor,
    );

    assert!(result.is_err());
    let message = result.unwrap_err();
    assert!(message.contains("verification warnings"));
}

#[test]
fn execute_verify_with_mock_warn_passes_with_allow_warnings() {
    let key = "agent-browser --json check https://example.com".to_string();
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
    let result = execute_verify_with_executor(
        &[
            "https://example.com".to_string(),
            "--allow-warnings".to_string(),
        ],
        &executor,
    );

    assert!(result.is_ok());
}

#[test]
fn parse_verify_args_reads_custom_binary() {
    let options = parse_verify_args(&[
        "https://example.com".to_string(),
        "--agent-browser-bin".to_string(),
        "/tmp/mock-agent-browser".to_string(),
        "--vision".to_string(),
    ])
    .unwrap();

    assert_eq!(options.agent_browser_bin, "/tmp/mock-agent-browser");
    assert!(options.vision);
}