use crate::plan::{generate_plan, DeployPlan};
use crate::{load_config_from_path, validate_config};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DeployOutputFormat {
    Human,
    Json,
}

#[derive(Debug, Serialize)]
struct DeployPlanOutput {
    plan: DeployPlan,
}

pub fn execute_deploy(args: &[String]) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("codra deploy plan [--config codra.deploy.json] [--json]");
        println!("  Validate and render a safe deployment plan.");
        return Ok(());
    }

    let (format, config_path) = parse_args(args)?;
    let config = load_config_from_path(&config_path).map_err(|err| err.to_string())?;
    let validation = validate_config(&config);
    if !validation.valid {
        return Err(render_validation_errors(&validation.errors));
    }
    let plan = generate_plan(&config);

    match format {
        DeployOutputFormat::Human => print_human(&plan),
        DeployOutputFormat::Json => {
            let body = serde_json::to_string_pretty(&DeployPlanOutput { plan })
                .map_err(|err| err.to_string())?;
            println!("{body}");
        }
    }

    Ok(())
}

fn parse_args(args: &[String]) -> Result<(DeployOutputFormat, PathBuf), String> {
    let mut format = DeployOutputFormat::Human;
    let mut config_path = PathBuf::from("codra.deploy.json");
    let mut iter = args.iter().peekable();

    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "plan" => {}
            "--json" => format = DeployOutputFormat::Json,
            "--config" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --config".to_string())?;
                config_path = PathBuf::from(value);
            }
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    Ok((format, config_path))
}

fn render_validation_errors(errors: &[crate::validator::ValidationError]) -> String {
    let mut out = String::from("invalid codra.deploy.json:\n");
    for error in errors {
        out.push_str(&format!("- {}: {}\n", error.path, error.message));
    }
    out.trim_end().to_string()
}

fn print_human(plan: &DeployPlan) {
    println!("Codra Deploy Plan");
    println!();
    println!("Project: {}", plan.project);
    println!("Services: {}", plan.services.len());
    println!();
    for service in &plan.services {
        println!("{}", service.name);
        println!("Type: {:?}", service.service_type);
        println!("Root: {}", service.root);
        println!(
            "Build: {}",
            service.build_command.as_deref().unwrap_or("not set")
        );
        println!(
            "Start: {}",
            service.start_command.as_deref().unwrap_or("not set")
        );
        if let Some(port) = service.expected_port {
            println!("Port: {}", port);
        }
        println!(
            "Health check: {}",
            service.health_check_path.as_deref().unwrap_or("not set")
        );
        if !service.env_keys.is_empty() {
            println!("Env keys: {}", service.env_keys.join(", "));
        }
        if !service.redacted_env.is_empty() {
            println!("Env values: redacted");
        }
        println!();
    }
    if !plan.warnings.is_empty() {
        println!("Warnings:");
        for warning in &plan.warnings {
            println!("- {}", warning.message);
        }
    }
}
