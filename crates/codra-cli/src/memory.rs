use codra_memory::{
    LocalMarkdownMemoryProvider, MemoryBudget, MemoryContextQuery, MemoryProvider, MemoryScope,
};
use serde::Serialize;

use crate::project;

#[derive(Debug, Serialize)]
struct MemoryStatusOutput {
    provider: String,
    project_path: String,
    task_id: Option<String>,
    global_files: Vec<FileLine>,
    project_files: Vec<FileLine>,
    task_files: Vec<FileLine>,
}

#[derive(Debug, Serialize)]
struct FileLine {
    path: String,
    present: bool,
}

pub fn execute_memory_command(args: &[String]) -> Result<(), String> {
    let sub = args.first().map(String::as_str).unwrap_or("help");
    match sub {
        "status" => execute_status(&args[1..]),
        "context" => execute_context(&args[1..]),
        "help" | "--help" | "-h" => {
            print_memory_help();
            Ok(())
        }
        other => Err(format!("unknown memory subcommand: {other}")),
    }
}

fn print_memory_help() {
    println!("codra memory <command>");
    println!("  status [--task <task-id>] [--json]   Show global/project/task memory files");
    println!("  context [--query <text>] [--task <task-id>] [--budget <chars>] [--json]");
    println!("                                       Build a budgeted memory context bundle");
}

fn parse_common_args(args: &[String]) -> Result<(MemoryScope, bool, Option<usize>), String> {
    let mut task_id = None;
    let mut json = false;
    let mut budget = None;

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--task" => {
                task_id = Some(
                    args.get(i + 1)
                        .ok_or_else(|| "missing value for --task".to_string())?
                        .clone(),
                );
                i += 2;
            }
            "--json" => {
                json = true;
                i += 1;
            }
            "--budget" => {
                let value = args
                    .get(i + 1)
                    .ok_or_else(|| "missing value for --budget".to_string())?;
                budget = Some(
                    value
                        .parse::<usize>()
                        .map_err(|_| format!("invalid --budget value: {value}"))?,
                );
                i += 2;
            }
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            _ => return Err(format!("unexpected argument: {}", args[i])),
        }
    }

    let project_path = project::project_root();
    let mut scope = MemoryScope::new(project_path);
    if let Some(id) = task_id {
        scope = scope.with_task(id);
    }

    Ok((scope, json, budget))
}

fn provider() -> LocalMarkdownMemoryProvider {
    LocalMarkdownMemoryProvider::new()
}

fn execute_status(args: &[String]) -> Result<(), String> {
    let (scope, json, _) = parse_common_args(args)?;
    let report = provider()
        .status(&scope)
        .map_err(|e| e.to_string())?;

    if json {
        let output = MemoryStatusOutput {
            provider: report.provider,
            project_path: scope.project_path.display().to_string(),
            task_id: scope.task_id,
            global_files: report
                .global_files
                .into_iter()
                .map(|f| FileLine {
                    path: f.path.display().to_string(),
                    present: f.present,
                })
                .collect(),
            project_files: report
                .project_files
                .into_iter()
                .map(|f| FileLine {
                    path: f.path.display().to_string(),
                    present: f.present,
                })
                .collect(),
            task_files: report
                .task_files
                .into_iter()
                .map(|f| FileLine {
                    path: f.path.display().to_string(),
                    present: f.present,
                })
                .collect(),
        };
        println!(
            "{}",
            serde_json::to_string_pretty(&output).map_err(|e| e.to_string())?
        );
        return Ok(());
    }

    println!("provider: {}", report.provider);
    println!("project: {}", scope.project_path.display());
    if let Some(task_id) = &scope.task_id {
        println!("task: {task_id}");
    }
    println!();
    println!("Global memory files:");
    for file in &report.global_files {
        println!(
            "  [{}] {}",
            if file.present { "found" } else { "missing" },
            file.path.display()
        );
    }
    println!();
    println!("Project memory files:");
    for file in &report.project_files {
        println!(
            "  [{}] {}",
            if file.present { "found" } else { "missing" },
            file.path.display()
        );
    }
    if !report.task_files.is_empty() {
        println!();
        println!("Task memory files:");
        for file in &report.task_files {
            println!(
                "  [{}] {}",
                if file.present { "found" } else { "missing" },
                file.path.display()
            );
        }
    }

    Ok(())
}

fn execute_context(args: &[String]) -> Result<(), String> {
    let mut query = None;
    let mut task_id = None;
    let mut json = false;
    let mut budget_total = None;

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--query" | "-q" => {
                query = Some(
                    args.get(i + 1)
                        .ok_or_else(|| "missing value for --query".to_string())?
                        .clone(),
                );
                i += 2;
            }
            "--task" => {
                task_id = Some(
                    args.get(i + 1)
                        .ok_or_else(|| "missing value for --task".to_string())?
                        .clone(),
                );
                i += 2;
            }
            "--json" => {
                json = true;
                i += 1;
            }
            "--budget" => {
                let value = args
                    .get(i + 1)
                    .ok_or_else(|| "missing value for --budget".to_string())?;
                budget_total = Some(
                    value
                        .parse::<usize>()
                        .map_err(|_| format!("invalid --budget value: {value}"))?,
                );
                i += 2;
            }
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    let project_path = project::project_root();
    let mut scope = MemoryScope::new(project_path);
    if let Some(id) = task_id {
        scope = scope.with_task(id);
    }

    let mut budget = MemoryBudget::default();
    if let Some(total) = budget_total {
        budget.total = total;
    }

    let bundle = provider()
        .context(MemoryContextQuery {
            scope,
            query,
            budget,
            ..Default::default()
        })
        .map_err(|e| e.to_string())?;

    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&bundle).map_err(|e| e.to_string())?
        );
        return Ok(());
    }

    println!("provider: {}", bundle.provider);
    println!(
        "budget: {} chars used / {} total{}",
        bundle.total_chars,
        bundle.budget.total,
        if bundle.truncated { " (truncated)" } else { "" }
    );
    println!();

    if !bundle.profile.static_facts.is_empty() {
        println!("## User profile (static)");
        for fact in &bundle.profile.static_facts {
            println!("- {fact}");
        }
        println!();
    }

    if !bundle.profile.dynamic_facts.is_empty() {
        println!("## User profile (dynamic)");
        for fact in &bundle.profile.dynamic_facts {
            println!("- {fact}");
        }
        println!();
    }

    for section in &bundle.sections {
        if !section.present && section.content.is_empty() {
            continue;
        }
        println!("## {}", section.name.replace('_', " "));
        if let Some(path) = &section.source_path {
            println!("source: {}", path.display());
        }
        if section.content.is_empty() {
            println!("(empty)");
        } else {
            println!("{}", section.content);
        }
        println!();
    }

    if !bundle.recall_results.is_empty() {
        println!("## Recall results");
        for result in &bundle.recall_results {
            println!(
                "- [{} score={:.2}] {}",
                result.source_path.display(),
                result.score,
                result.content.lines().next().unwrap_or("")
            );
        }
    }

    Ok(())
}