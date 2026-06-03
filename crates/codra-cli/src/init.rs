use std::fs;
use std::path::{Path, PathBuf};

use crate::project;

#[derive(Debug, Clone, Copy, Default)]
pub struct InitOptions {
    pub force: bool,
    pub dry_run: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum InitAction {
    Created,
    Exists,
    WouldCreate,
    WouldOverwrite,
    Overwritten,
}

pub fn execute_init(args: &[String]) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("codra init [--force] [--dry-run]");
        println!("  Creates CODRA.md, .codra/commands, and .codra/agents.");
        return Ok(());
    }

    let opts = parse_init_args(args)?;
    init_project(opts)
}

pub fn parse_init_args(args: &[String]) -> Result<InitOptions, String> {
    let mut opts = InitOptions::default();

    for arg in args {
        match arg.as_str() {
            "--force" => opts.force = true,
            "--dry-run" => opts.dry_run = true,
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    Ok(opts)
}

pub fn init_project(opts: InitOptions) -> Result<(), String> {
    let root = project::project_root();
    let targets = starter_targets(&root);

    println!("Codra project setup");
    println!("Directory: {}", root.display());

    for dir in [
        root.join(".codra"),
        root.join(".codra/commands"),
        root.join(".codra/agents"),
    ] {
        let action = ensure_dir(&dir, opts)?;
        print_action(action, &dir);
    }

    for (path, content) in targets {
        let action = ensure_file(&path, content, opts)?;
        print_action(action, &path);
    }

    if opts.dry_run {
        println!("Dry run only; no files changed.");
    }

    Ok(())
}

fn starter_targets(root: &Path) -> Vec<(PathBuf, &'static str)> {
    vec![
        (root.join("CODRA.md"), CODRA_MD),
        (root.join(".codra/commands/review-pr.md"), REVIEW_PR_MD),
        (
            root.join(".codra/commands/explain-issue.md"),
            EXPLAIN_ISSUE_MD,
        ),
        (
            root.join(".codra/agents/code-reviewer.md"),
            CODE_REVIEWER_MD,
        ),
    ]
}

fn ensure_dir(path: &Path, opts: InitOptions) -> Result<InitAction, String> {
    if path.exists() {
        return Ok(InitAction::Exists);
    }

    if opts.dry_run {
        return Ok(InitAction::WouldCreate);
    }

    fs::create_dir_all(path)
        .map_err(|err| format!("failed to create {}: {err}", path.display()))?;
    Ok(InitAction::Created)
}

fn ensure_file(path: &Path, content: &str, opts: InitOptions) -> Result<InitAction, String> {
    if path.exists() {
        if opts.force {
            if opts.dry_run {
                return Ok(InitAction::WouldOverwrite);
            }
            fs::write(path, content)
                .map_err(|err| format!("failed to write {}: {err}", path.display()))?;
            return Ok(InitAction::Overwritten);
        }
        return Ok(InitAction::Exists);
    }

    if opts.dry_run {
        return Ok(InitAction::WouldCreate);
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|err| format!("failed to create {}: {err}", parent.display()))?;
    }
    fs::write(path, content).map_err(|err| format!("failed to write {}: {err}", path.display()))?;
    Ok(InitAction::Created)
}

fn print_action(action: InitAction, path: &Path) {
    let label = match action {
        InitAction::Created => "created",
        InitAction::Exists => "exists",
        InitAction::WouldCreate => "would create",
        InitAction::WouldOverwrite => "would overwrite",
        InitAction::Overwritten => "overwritten",
    };
    println!("  {label}: {}", path.display());
}

const CODRA_MD: &str = r#"# CODRA.md

## Project Overview
Describe what this repository builds and who it serves.

## Coding Standards
List language, formatting, testing, and review expectations.

## Commands
Document common setup, test, build, and verification commands.

## Agent Instructions
Tell Codra how to inspect, edit, and validate this repo.

## Safety Rules
Note files, secrets, generated outputs, or operations Codra must avoid.
"#;

const REVIEW_PR_MD: &str = r#"# review-pr

Review the current pull request for correctness, risk, and missing tests.
Prioritize concrete findings with file and line references when available.
"#;

const EXPLAIN_ISSUE_MD: &str = r#"# explain-issue

Summarize the issue, identify likely affected areas, and propose next steps.
Keep recommendations practical and grounded in repository context.
"#;

const CODE_REVIEWER_MD: &str = r#"# code-reviewer

Focus on correctness, maintainability, tests, security, and user impact.
Avoid speculative feedback when repository evidence is missing.
"#;
