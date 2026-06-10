use crate::agent_browser_exec::{
    AgentBrowserExecutor, RealAgentBrowserExecutor, AGENT_BROWSER_INSTALL_MESSAGE,
};
use crate::url_safety::assert_safe_url;
use serde::Serialize;
use serde_json::Value;

const DEFAULT_AGENT_BROWSER_BIN: &str = "agent-browser";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VerifyOptions {
    pub url: String,
    pub screenshot_out: Option<String>,
    pub vision: bool,
    pub json: bool,
    pub allow_warnings: bool,
    pub agent_browser_bin: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AgentBrowserParsed {
    pub status: String,
    pub summary: String,
    pub url: String,
    pub result: Value,
}

#[derive(Debug, Serialize)]
struct VerifyJsonOutput {
    command: &'static str,
    url: String,
    status: String,
    summary: String,
    allow_warnings: bool,
    result: Value,
}

pub fn execute_verify(args: &[String]) -> Result<(), String> {
    execute_verify_with_executor(args, &RealAgentBrowserExecutor)
}

pub fn execute_verify_with_executor(
    args: &[String],
    executor: &dyn AgentBrowserExecutor,
) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        print_verify_help();
        return Ok(());
    }

    let options = parse_verify_args(args)?;
    assert_safe_url(&options.url)?;

    let command_args = build_agent_browser_args(&options);
    let output = executor.run(&options.agent_browser_bin, &command_args)?;

    if !output.success() {
        let stderr = output.stderr.trim();
        let message = if stderr.is_empty() {
            format!(
                "agent-browser exited with status {}",
                output.status
            )
        } else {
            stderr.to_string()
        };
        return Err(message);
    }

    let parsed = parse_agent_browser_response(&output.stdout)?;
    print_verify_output(&options, &parsed)?;
    evaluate_verify_outcome(&parsed.status, &parsed.summary, options.allow_warnings)
}

pub fn parse_verify_args(args: &[String]) -> Result<VerifyOptions, String> {
    let mut screenshot_out = None;
    let mut vision = false;
    let mut json = false;
    let mut allow_warnings = false;
    let mut agent_browser_bin = DEFAULT_AGENT_BROWSER_BIN.to_string();
    let mut url = None;
    let mut iter = args.iter().peekable();

    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--screenshot-out" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --screenshot-out".to_string())?;
                screenshot_out = Some(value.clone());
            }
            "--agent-browser-bin" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --agent-browser-bin".to_string())?;
                agent_browser_bin = value.clone();
            }
            "--vision" => vision = true,
            "--json" => json = true,
            "--allow-warnings" => allow_warnings = true,
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            value => {
                if url.is_some() {
                    return Err(format!("unexpected argument: {value}"));
                }
                url = Some(value.to_string());
            }
        }
    }

    let url = url.ok_or_else(|| "URL is required".to_string())?;

    Ok(VerifyOptions {
        url,
        screenshot_out,
        vision,
        json,
        allow_warnings,
        agent_browser_bin,
    })
}

pub fn build_agent_browser_args(options: &VerifyOptions) -> Vec<String> {
    let mut args = vec![
        "--json".to_string(),
        "check".to_string(),
        options.url.clone(),
    ];

    if let Some(path) = &options.screenshot_out {
        args.push("--screenshot-out".to_string());
        args.push(path.clone());
    }

    if options.vision {
        args.push("--vision".to_string());
    }

    args
}

pub fn parse_agent_browser_response(stdout: &str) -> Result<AgentBrowserParsed, String> {
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return Err("agent-browser returned empty output".to_string());
    }

    let value: Value =
        serde_json::from_str(trimmed).map_err(|err| format!("invalid agent-browser JSON: {err}"))?;

    if value.get("ok") == Some(&Value::Bool(false)) {
        let message = value
            .get("error")
            .and_then(|error| error.get("message"))
            .and_then(Value::as_str)
            .unwrap_or("agent-browser command failed");
        return Err(message.to_string());
    }

    let result = value
        .get("result")
        .cloned()
        .ok_or_else(|| "agent-browser response missing result".to_string())?;

    let status = result
        .get("status")
        .and_then(Value::as_str)
        .ok_or_else(|| "agent-browser result missing status".to_string())?
        .to_string();
    let summary = result
        .get("summary")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let url = result
        .get("url")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();

    Ok(AgentBrowserParsed {
        status,
        summary,
        url,
        result,
    })
}

pub fn evaluate_verify_outcome(
    status: &str,
    summary: &str,
    allow_warnings: bool,
) -> Result<(), String> {
    match status {
        "pass" => Ok(()),
        "warn" if allow_warnings => Ok(()),
        "warn" => Err(format!("verification warnings: {summary}")),
        "fail" => Err(format!("verification failed: {summary}")),
        other => Err(format!("unknown verification status: {other}")),
    }
}

pub fn format_verify_human(parsed: &AgentBrowserParsed) -> String {
    let icon = match parsed.status.as_str() {
        "pass" => "PASS",
        "warn" => "WARN",
        "fail" => "FAIL",
        _ => "UNKNOWN",
    };

    let mut lines = vec![
        "Codra Deploy Verify".to_string(),
        format!("Status: {icon}"),
        format!("URL: {}", parsed.url),
        String::new(),
    ];

    if let Some(checks) = parsed.result.get("checks").and_then(Value::as_array) {
        for check in checks {
            let status = check.get("status").and_then(Value::as_str).unwrap_or("?");
            let message = check.get("message").and_then(Value::as_str).unwrap_or("");
            let marker = match status {
                "pass" => "[ok]",
                "warn" => "[warn]",
                "fail" => "[fail]",
                _ => "[?]",
            };
            lines.push(format!("{marker} {message}"));
        }
        lines.push(String::new());
    }

    lines.push(format!("Summary: {}", parsed.summary));

    if let Some(warnings) = parsed
        .result
        .get("vision")
        .and_then(|vision| vision.get("warnings"))
        .and_then(Value::as_array)
    {
        if !warnings.is_empty() {
            let joined = warnings
                .iter()
                .filter_map(Value::as_str)
                .collect::<Vec<_>>()
                .join("; ");
            lines.push(format!("Vision warnings: {joined}"));
        }
    }

    lines.join("\n")
}

fn print_verify_output(options: &VerifyOptions, parsed: &AgentBrowserParsed) -> Result<(), String> {
    if options.json {
        let body = VerifyJsonOutput {
            command: "codra deploy verify",
            url: parsed.url.clone(),
            status: parsed.status.clone(),
            summary: parsed.summary.clone(),
            allow_warnings: options.allow_warnings,
            result: parsed.result.clone(),
        };
        let rendered =
            serde_json::to_string_pretty(&body).map_err(|err| err.to_string())?;
        println!("{rendered}");
        return Ok(());
    }

    println!("{}", format_verify_human(parsed));
    Ok(())
}

fn print_verify_help() {
    println!("codra deploy verify <url> [--screenshot-out <path>] [--vision] [--json] [--allow-warnings] [--agent-browser-bin <path>]");
    println!("  Run Agent Browser smoke check against a deployed public URL.");
    println!("  Requires agent-browser on PATH or install guidance is printed.");
}

pub fn agent_browser_install_message() -> &'static str {
    AGENT_BROWSER_INSTALL_MESSAGE
}