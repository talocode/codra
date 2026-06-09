mod logs;
mod plan;
mod up;

use std::env;

pub use plan::DeployOutputFormat;

pub fn execute_deploy(args: &[String]) -> Result<(), String> {
    let subcommand = args.first().map(String::as_str).unwrap_or("");

    match subcommand {
        "plan" => plan::execute_plan(&args[1..]),
        "up" => up::execute_up(&args[1..]),
        "logs" => logs::execute_logs(&args[1..]),
        "" | "--help" | "-h" => {
            print_deploy_help();
            Ok(())
        }
        other => Err(format!("unknown deploy subcommand: {other}")),
    }
}

pub fn execution_enabled(execute_flag: bool) -> bool {
    execute_flag && env::var("CODRA_DEPLOY_ENABLE_EXECUTE").ok().as_deref() == Some("1")
}

fn print_deploy_help() {
    println!("codra deploy <command>");
    println!();
    println!("Commands:");
    println!("  plan   Validate and render a safe deployment plan");
    println!("  up     Prepare or execute a local Docker deployment");
    println!("  logs   Show logs for a deployed service container");
    println!();
    println!("Examples:");
    println!("  codra deploy plan --config codra.deploy.json");
    println!("  codra deploy up --dry-run");
    println!("  CODRA_DEPLOY_ENABLE_EXECUTE=1 codra deploy up --execute --service web");
    println!("  codra deploy logs --service web --tail 100");
}