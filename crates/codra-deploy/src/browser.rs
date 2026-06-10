use crate::agent_browser_exec::{AgentBrowserExecutor, RealAgentBrowserExecutor};
use crate::cli::verify::{
    parse_verify_args, run_verify_with_executor, VerifyPresentation,
};

pub fn execute_browser_check(args: &[String]) -> Result<(), String> {
    execute_browser_check_with_executor(args, &RealAgentBrowserExecutor)
}

pub fn execute_browser_check_with_executor(
    args: &[String],
    executor: &dyn AgentBrowserExecutor,
) -> Result<(), String> {
    if args.first().map(String::as_str) != Some("check") {
        return Err("unknown browser subcommand; expected: check".to_string());
    }

    if args[1..].iter().any(|arg| arg == "--help" || arg == "-h") {
        print_browser_check_help();
        return Ok(());
    }

    let options = parse_verify_args(&args[1..])?;
    run_verify_with_executor(&options, executor, VerifyPresentation::BrowserCheck)
}

fn print_browser_check_help() {
    println!("codra browser check <url> [--screenshot-out <path>] [--vision] [--json] [--allow-warnings] [--agent-browser-bin <path>]");
    println!("  Run Agent Browser smoke check against a public URL.");
    println!("  Alias for the same verifier used by codra deploy verify.");
}