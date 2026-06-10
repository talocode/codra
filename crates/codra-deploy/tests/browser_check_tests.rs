use codra_deploy::{
    agent_browser_install_message, build_agent_browser_args, execute_browser_check_with_executor,
    execute_verify_with_executor, format_verify_human, parse_verify_args, AgentBrowserCommandOutput,
    MockAgentBrowserExecutor, VerifyPresentation,
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
                "vision": {{ "enabled": false, "warnings": [] }}
            }}
        }}"#
    )
}

fn mock_executor(status: &str, summary: &str) -> MockAgentBrowserExecutor {
    let key = "agent-browser --json check https://example.com".to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key,
        Ok(AgentBrowserCommandOutput {
            status: 0,
            stdout: sample_result_json(status, summary),
            stderr: String::new(),
        }),
    );
    MockAgentBrowserExecutor::new(responses)
}

#[test]
fn browser_check_rejects_unsafe_url() {
    let executor = MockAgentBrowserExecutor::new(HashMap::new());
    let result = execute_browser_check_with_executor(
        &["check".to_string(), "http://localhost:3000".to_string()],
        &executor,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Localhost is disabled"));
    assert!(executor.calls().is_empty());
}

#[test]
fn browser_check_missing_binary_gives_guidance() {
    let key = "agent-browser --json check https://example.com".to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key,
        Err(agent_browser_install_message().to_string()),
    );
    let executor = MockAgentBrowserExecutor::new(responses);

    let result = execute_browser_check_with_executor(
        &[
            "check".to_string(),
            "https://example.com".to_string(),
        ],
        &executor,
    );

    let message = result.unwrap_err();
    assert!(message.contains("npm install -g @talocode/agent-browser"));
    assert!(message.contains("talocode/agent-browser@v0"));
}

#[test]
fn browser_check_pass_parses_json_command_field() {
    let executor = mock_executor("pass", "Smoke check passed.");
    let result = execute_browser_check_with_executor(
        &[
            "check".to_string(),
            "https://example.com".to_string(),
            "--json".to_string(),
        ],
        &executor,
    );

    assert!(result.is_ok());
    assert_eq!(executor.calls().len(), 1);
}

#[test]
fn browser_check_warn_fails_without_allow_warnings() {
    let executor = mock_executor("warn", "Smoke check passed with warnings.");
    let result = execute_browser_check_with_executor(
        &[
            "check".to_string(),
            "https://example.com".to_string(),
        ],
        &executor,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("verification warnings"));
}

#[test]
fn browser_check_warn_passes_with_allow_warnings() {
    let executor = mock_executor("warn", "Smoke check passed with warnings.");
    let result = execute_browser_check_with_executor(
        &[
            "check".to_string(),
            "https://example.com".to_string(),
            "--allow-warnings".to_string(),
        ],
        &executor,
    );

    assert!(result.is_ok());
}

#[test]
fn browser_check_uses_same_verifier_args_as_deploy_verify() {
    let options = parse_verify_args(&[
        "https://example.com".to_string(),
        "--screenshot-out".to_string(),
        "check.png".to_string(),
        "--vision".to_string(),
    ])
    .unwrap();

    let browser_args = build_agent_browser_args(&options);
    assert_eq!(
        browser_args,
        vec![
            "--json".to_string(),
            "check".to_string(),
            "https://example.com".to_string(),
            "--screenshot-out".to_string(),
            "check.png".to_string(),
            "--vision".to_string(),
        ]
    );
}

#[test]
fn browser_check_and_deploy_verify_invoke_same_agent_browser_command() {
    let key = "agent-browser --json check https://example.com".to_string();
    let mut responses = HashMap::new();
    responses.insert(
        key.clone(),
        Ok(AgentBrowserCommandOutput {
            status: 0,
            stdout: sample_result_json("pass", "Smoke check passed."),
            stderr: String::new(),
        }),
    );

    let executor = MockAgentBrowserExecutor::new(responses);

    execute_browser_check_with_executor(
        &["check".to_string(), "https://example.com".to_string()],
        &executor,
    )
    .unwrap();

    execute_verify_with_executor(&["https://example.com".to_string()], &executor).unwrap();

    let calls = executor.calls();
    assert_eq!(calls.len(), 2);
    assert_eq!(calls[0].1, calls[1].1);
}

#[test]
fn browser_check_human_output_uses_browser_title() {
    let parsed = codra_deploy::parse_agent_browser_response(&sample_result_json(
        "pass",
        "Smoke check passed.",
    ))
    .unwrap();
    let rendered = format_verify_human(&parsed, VerifyPresentation::BrowserCheck.human_title());
    assert!(rendered.starts_with("Codra Browser Check"));
}