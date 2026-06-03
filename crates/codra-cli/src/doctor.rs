use std::env;
use std::path::PathBuf;

use serde::Serialize;

use crate::project;

#[derive(Debug, Serialize)]
struct DoctorReport {
    checks: Vec<DoctorCheck>,
}

#[derive(Debug, Serialize)]
struct DoctorCheck {
    name: &'static str,
    status: &'static str,
    detail: String,
}

pub fn execute_doctor(args: &[String]) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("codra doctor [--json]");
        println!("  Checks local environment readiness without printing secret values.");
        return Ok(());
    }

    let json = parse_doctor_args(args)?;
    let report = collect_report();

    if json {
        let body = serde_json::to_string_pretty(&report).map_err(|err| err.to_string())?;
        println!("{body}");
    } else {
        print_human_report(&report);
    }

    Ok(())
}

fn parse_doctor_args(args: &[String]) -> Result<bool, String> {
    let mut json = false;
    for arg in args {
        match arg.as_str() {
            "--json" => json = true,
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }
    Ok(json)
}

fn collect_report() -> DoctorReport {
    let cwd = project::current_dir();
    let root = project::project_root();
    let git_installed = project::command_exists("git");
    let inside_git = git_installed && project::is_inside_git_repo();
    let branch = if inside_git {
        project::git_branch().unwrap_or_else(|| "detached".to_string())
    } else {
        "n/a".to_string()
    };
    let working_tree = if inside_git {
        match project::git_status_short() {
            Some(value) if !value.trim().is_empty() => "dirty".to_string(),
            _ => "clean".to_string(),
        }
    } else {
        "n/a".to_string()
    };

    DoctorReport {
        checks: vec![
            ok("current directory", cwd.display().to_string()),
            check("git installed", git_installed, detail_or_missing("git")),
            check("inside git repo", inside_git, yes_no(inside_git)),
            ok("branch", branch),
            ok("working tree", working_tree),
            check(
                "cargo available",
                project::command_exists("cargo"),
                detail_or_missing("cargo"),
            ),
            check(
                "node available",
                project::command_exists("node"),
                detail_or_missing("node"),
            ),
            check(
                "npm available",
                project::command_exists("npm"),
                detail_or_missing("npm"),
            ),
            check(
                "pnpm available",
                project::command_exists("pnpm"),
                detail_or_missing("pnpm"),
            ),
            check(
                "GitHub Actions env",
                env::var("GITHUB_ACTIONS")
                    .map(|value| value == "true")
                    .unwrap_or(false),
                yes_no(
                    env::var("GITHUB_ACTIONS")
                        .map(|value| value == "true")
                        .unwrap_or(false),
                ),
            ),
            check(
                "GITHUB_TOKEN present",
                env::var("GITHUB_TOKEN")
                    .map(|value| !value.is_empty())
                    .unwrap_or(false),
                yes_no(
                    env::var("GITHUB_TOKEN")
                        .map(|value| !value.is_empty())
                        .unwrap_or(false),
                ),
            ),
            check(
                "CODRA.md exists",
                root.join("CODRA.md").exists(),
                path_detail(root.join("CODRA.md")),
            ),
            check(
                ".codra directory exists",
                root.join(".codra").is_dir(),
                path_detail(root.join(".codra")),
            ),
            check(
                "codra binary on PATH",
                project::which("codra").is_some(),
                project::which("codra").unwrap_or_else(|| "not found".to_string()),
            ),
            ok("npm platform key", project::npm_platform_key()),
        ],
    }
}

fn print_human_report(report: &DoctorReport) {
    println!("Codra doctor");
    println!();
    for check in &report.checks {
        println!("{:<24} {:<7} {}", check.name, check.status, check.detail);
    }
}

fn ok(name: &'static str, detail: String) -> DoctorCheck {
    DoctorCheck {
        name,
        status: "ok",
        detail,
    }
}

fn check(name: &'static str, ok: bool, detail: String) -> DoctorCheck {
    DoctorCheck {
        name,
        status: if ok { "ok" } else { "warn" },
        detail,
    }
}

fn yes_no(value: bool) -> String {
    if value {
        "yes".to_string()
    } else {
        "no".to_string()
    }
}

fn detail_or_missing(program: &str) -> String {
    project::which(program).unwrap_or_else(|| "not found".to_string())
}

fn path_detail(path: PathBuf) -> String {
    path.display().to_string()
}
