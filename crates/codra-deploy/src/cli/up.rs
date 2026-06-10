use crate::agent_browser_exec::{AgentBrowserExecutor, RealAgentBrowserExecutor};
use crate::cli::execution_enabled;
use crate::docker_availability::detect_docker_available;
use crate::docker_exec::RealDockerExecutor;
use crate::post_verify::run_post_deploy_verification;
use crate::runner::docker::LocalDockerRunner;
use crate::runner::runtime::{RuntimeMode, RuntimePlan, RuntimeStatus};
use crate::validator::ValidationError;
use crate::{load_config_from_path, validate_config};
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
struct DeployUpOutput {
    project: String,
    mode: RuntimeMode,
    executable_services: Vec<String>,
    skipped_services: Vec<crate::runner::runtime::SkippedService>,
    commands: Vec<String>,
    warnings: Vec<crate::runner::runtime::RuntimeWarning>,
    status: RuntimeStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

pub fn execute_up(args: &[String]) -> Result<(), String> {
    execute_up_with_executor(args, &RealAgentBrowserExecutor)
}

pub fn execute_up_with_executor(
    args: &[String],
    verify_executor: &dyn AgentBrowserExecutor,
) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("codra deploy up [--config codra.deploy.json] [--service <name>] [--dry-run] [--execute] [--verify] [--json]");
        println!("  Prepare or execute a local Docker deployment.");
        println!("  Default mode is dry-run. Real execution requires --execute and CODRA_DEPLOY_ENABLE_EXECUTE=1.");
        println!("  Post-deploy verification runs only with --verify when service.verify.enabled is true.");
        return Ok(());
    }

    let parsed = parse_args(args)?;
    let config = load_config_from_path(&parsed.config_path).map_err(|err| err.to_string())?;
    let validation = validate_config(&config);
    if !validation.valid {
        return Err(render_validation_errors(&validation.errors));
    }

    let config_dir = parsed
        .config_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));

    let wants_execute = parsed.execute;
    let mode = if wants_execute {
        RuntimeMode::Execute
    } else {
        RuntimeMode::DryRun
    };

    let mut plan = LocalDockerRunner::plan_runtime(
        &config,
        parsed.service.as_deref(),
        &config_dir,
        mode,
    );

    let deploy_result = if wants_execute && !execution_enabled(parsed.execute) {
        plan.status = RuntimeStatus::Refused;
        finish_up(
            parsed.json,
            plan,
            Some(
                "execution refused: set CODRA_DEPLOY_ENABLE_EXECUTE=1 to enable real Docker execution"
                    .to_string(),
            ),
        )
    } else if wants_execute && execution_enabled(parsed.execute) {
        let availability = detect_docker_available();
        if !availability.available {
            plan.status = RuntimeStatus::Failed;
            finish_up(
                parsed.json,
                plan,
                Some(format!(
                    "Docker execution failed: {}",
                    availability.message
                )),
            )
        } else {
            match LocalDockerRunner::execute(&plan, &RealDockerExecutor) {
                Ok(result) => {
                    plan.status = result.status;
                    finish_up(parsed.json, plan, result.message)
                }
                Err(err) => {
                    plan.status = RuntimeStatus::Failed;
                    finish_up(parsed.json, plan, Some(err))
                }
            }
        }
    } else {
        finish_up(parsed.json, plan, None)
    };

    deploy_result?;
    if parsed.verify {
        run_post_deploy_verification(
            &config,
            parsed.service.as_deref(),
            parsed.json,
            verify_executor,
        )?;
    }

    Ok(())
}

struct UpArgs {
    config_path: PathBuf,
    service: Option<String>,
    execute: bool,
    verify: bool,
    json: bool,
}

fn parse_args(args: &[String]) -> Result<UpArgs, String> {
    let mut config_path = PathBuf::from("codra.deploy.json");
    let mut service = None;
    let mut dry_run = false;
    let mut execute = false;
    let mut verify = false;
    let mut json = false;
    let mut iter = args.iter().peekable();

    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--config" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --config".to_string())?;
                config_path = PathBuf::from(value);
            }
            "--service" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --service".to_string())?;
                service = Some(value.to_string());
            }
            "--dry-run" => dry_run = true,
            "--execute" => execute = true,
            "--verify" => verify = true,
            "--json" => json = true,
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    if dry_run && execute {
        return Err("cannot use --dry-run and --execute together".to_string());
    }

    Ok(UpArgs {
        config_path,
        service,
        execute,
        verify,
        json,
    })
}

fn finish_up(json: bool, plan: RuntimePlan, message: Option<String>) -> Result<(), String> {
    if json {
        let output = DeployUpOutput {
            project: plan.project.clone(),
            mode: plan.mode,
            executable_services: plan
                .executable_services
                .iter()
                .map(|service| service.name.clone())
                .collect(),
            skipped_services: plan.skipped_services.clone(),
            commands: plan.commands.clone(),
            warnings: plan.warnings.clone(),
            status: plan.status,
            message: message.clone(),
        };
        let body = serde_json::to_string_pretty(&output).map_err(|err| err.to_string())?;
        println!("{body}");
    } else {
        print_human(&plan, message.as_deref());
    }

    if matches!(plan.status, RuntimeStatus::Failed | RuntimeStatus::Refused) {
        return Err(message.unwrap_or_else(|| "deploy up failed".to_string()));
    }

    Ok(())
}

fn print_human(plan: &RuntimePlan, message: Option<&str>) {
    println!("Codra Deploy Up");
    println!();
    println!("Project: {}", plan.project);
    println!("Mode: {:?}", plan.mode);
    println!("Status: {:?}", plan.status);
    println!();

    if !plan.executable_services.is_empty() {
        println!("Executable services:");
        for service in &plan.executable_services {
            println!("- {} ({:?})", service.name, service.service_type);
            println!("  Container: {}", service.container_name);
            println!("  Image: {}", service.image);
        }
        println!();
    }

    if !plan.skipped_services.is_empty() {
        println!("Skipped services:");
        for service in &plan.skipped_services {
            println!("- {} ({:?}): {}", service.name, service.service_type, service.reason);
        }
        println!();
    }

    if !plan.commands.is_empty() {
        println!("Commands:");
        for command in &plan.commands {
            println!("- {command}");
        }
        println!();
    }

    if !plan.warnings.is_empty() {
        println!("Warnings:");
        for warning in &plan.warnings {
            if let Some(service) = &warning.service {
                println!("- [{service}] {}", warning.message);
            } else {
                println!("- {}", warning.message);
            }
        }
        println!();
    }

    if let Some(message) = message {
        println!("{message}");
    }
}

fn render_validation_errors(errors: &[ValidationError]) -> String {
    let mut out = String::from("invalid codra.deploy.json:\n");
    for error in errors {
        out.push_str(&format!("- {}: {}\n", error.path, error.message));
    }
    out.trim_end().to_string()
}