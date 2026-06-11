use crate::project;

pub fn welcome() -> Result<(), String> {
    let cwd = project::current_dir();
    let git = git_summary();

    println!("Codra");
    println!();
    println!("Local-first AI coding agent for your repo.");
    println!();
    println!("Directory: {}", cwd.display());
    println!("Git: {}", git);
    println!("Mode: local");
    println!("Model: not configured");
    println!("GitHub context: local");
    println!();
    println!("Commands:");
    println!("  codra run --task review-pr --jsonl");
    println!("  codra run --task summarize-context");
    println!("  codra init");
    println!("  codra doctor");
    println!("  codra --help");
    println!();
    println!("Next:");
    println!("  Run \"codra init\" to create CODRA.md for this repo.");
    println!("  Run \"codra doctor\" to check your environment.");
    println!("  Run \"codra deploy plan --config codra.deploy.json\" to preview deployments.");
    Ok(())
}

pub fn help() -> Result<(), String> {
    println!("codra <command>");
    println!("  init [--force] [--dry-run]     Create CODRA.md and .codra project skeleton");
    println!("  doctor [--json]                Check local Codra environment readiness");
    println!("  deploy plan [--json]           Validate and render a safe deployment plan");
    println!("  deploy up [--dry-run|--execute] Prepare or run a local Docker deployment");
    println!("  deploy logs --service <name>   Show logs for a deployed service container");
    println!("  deploy verify <url>            Run Agent Browser smoke check on a deployed URL");
    println!("  browser check <url>            Run a direct Agent Browser smoke check");
    println!("  memory status [--task <id>]    Show local memory files and provider");
    println!("  memory context [--query <q>]   Build a budgeted memory context bundle");
    println!("  run --task <task> [--jsonl]    Run a task with optional JSONL event stream");
    println!("                                 Tasks: review-pr, explain-issue, summarize-context");
    println!(
        "  smoke                          Validate local tool registry and workspace readiness"
    );
    println!("  provider check                 Check active provider health");
    println!("  worker add                     Register a remote worker");
    println!("  worker check                   Probe a registered worker's health endpoint");
    println!("  worker list                    List registered workers");
    println!("  worker pair                    Interactive pair and verify a remote worker");
    println!("  worker trust                   Update a worker's trust level");
    println!("  worker remove                  Remove/unpair a registered worker");
    println!("  headless <intent>              Run a dry-run headless planning surface");
    println!("  mcp-server                     Print MCP-compatible server/tool metadata");
    Ok(())
}

fn git_summary() -> String {
    if !project::command_exists("git") {
        return "not available".to_string();
    }

    if !project::is_inside_git_repo() {
        return "not a git repo".to_string();
    }

    let branch = project::git_branch().unwrap_or_else(|| "detached".to_string());
    let status = match project::git_status_short() {
        Some(value) if !value.trim().is_empty() => "dirty",
        _ => "clean",
    };
    format!("branch {branch}, {status}")
}
