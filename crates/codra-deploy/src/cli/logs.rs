use crate::config::DeployServiceType;
use crate::docker_availability::detect_docker_available;
use crate::docker_exec::{DockerExecutor, RealDockerExecutor};
use crate::naming::default_container_name;
use crate::runner::runtime::{LogsPlan, LogsStatus};
use crate::validator::ValidationError;
use crate::{load_config_from_path, validate_config};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
struct DeployLogsOutput {
    project: String,
    service: String,
    container_name: String,
    tail: u32,
    command: String,
    status: LogsStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    output: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

pub fn execute_logs(args: &[String]) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("codra deploy logs --service <name> [--config codra.deploy.json] [--tail <n>] [--json]");
        println!("  Show logs for a deployed service container.");
        return Ok(());
    }

    let parsed = parse_args(args)?;
    let service_name = parsed
        .service
        .ok_or_else(|| "--service is required".to_string())?;

    let config = load_config_from_path(&parsed.config_path).map_err(|err| err.to_string())?;
    let validation = validate_config(&config);
    if !validation.valid {
        return Err(render_validation_errors(&validation.errors));
    }

    let service = config
        .services
        .iter()
        .find(|service| service.name == service_name)
        .ok_or_else(|| format!("service '{service_name}' was not found in config"))?;

    if !matches!(
        service.service_type,
        DeployServiceType::Web | DeployServiceType::Worker
    ) {
        return Err(format!(
            "logs are only supported for web and worker services; '{}' is {:?}",
            service.name, service.service_type
        ));
    }

    let container_name = service
        .container_name
        .clone()
        .unwrap_or_else(|| default_container_name(&config.project, &service.name));
    let command = format!("docker logs --tail {} {container_name}", parsed.tail);

    let availability = detect_docker_available();
    if !availability.available {
        let plan = LogsPlan {
            project: config.project.clone(),
            service: service_name.clone(),
            container_name: container_name.clone(),
            tail: parsed.tail,
            command: command.clone(),
            output: None,
            status: LogsStatus::Failed,
            message: Some(format!(
                "Docker is not available. Install Docker and ensure the daemon is running. {}",
                availability.message
            )),
        };
        return finish_logs(parsed.json, plan);
    }

    let output = RealDockerExecutor.run(&[
        "docker",
        "logs",
        "--tail",
        &parsed.tail.to_string(),
        &container_name,
    ]);

    match output {
        Ok(result) if result.success() => {
            let logs = result.stdout.trim_end().to_string();
            let plan = LogsPlan {
                project: config.project.clone(),
                service: service_name,
                container_name,
                tail: parsed.tail,
                command,
                output: Some(logs.clone()),
                status: LogsStatus::Executed,
                message: None,
            };
            finish_logs(parsed.json, plan)
        }
        Ok(result) => {
            let message = if result.stderr.contains("No such container") {
                format!("container '{container_name}' was not found; deploy the service first with codra deploy up")
            } else {
                result.stderr.trim().to_string()
            };
            let plan = LogsPlan {
                project: config.project.clone(),
                service: service_name,
                container_name,
                tail: parsed.tail,
                command,
                output: None,
                status: LogsStatus::Failed,
                message: Some(message.clone()),
            };
            finish_logs(parsed.json, plan)
        }
        Err(err) => {
            let plan = LogsPlan {
                project: config.project.clone(),
                service: service_name,
                container_name,
                tail: parsed.tail,
                command,
                output: None,
                status: LogsStatus::Failed,
                message: Some(err),
            };
            finish_logs(parsed.json, plan)
        }
    }
}

struct LogsArgs {
    config_path: PathBuf,
    service: Option<String>,
    tail: u32,
    json: bool,
}

fn parse_args(args: &[String]) -> Result<LogsArgs, String> {
    let mut config_path = PathBuf::from("codra.deploy.json");
    let mut service = None;
    let mut tail = 100;
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
            "--tail" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --tail".to_string())?;
                tail = value
                    .parse::<u32>()
                    .map_err(|_| "invalid value for --tail".to_string())?;
            }
            "--json" => json = true,
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    Ok(LogsArgs {
        config_path,
        service,
        tail,
        json,
    })
}

fn finish_logs(json: bool, plan: LogsPlan) -> Result<(), String> {
    if json {
        let output = DeployLogsOutput {
            project: plan.project,
            service: plan.service,
            container_name: plan.container_name,
            tail: plan.tail,
            command: plan.command,
            status: plan.status,
            output: plan.output.clone(),
            message: plan.message.clone(),
        };
        let body = serde_json::to_string_pretty(&output).map_err(|err| err.to_string())?;
        println!("{body}");
    } else {
        println!("Codra Deploy Logs");
        println!();
        println!("Project: {}", plan.project);
        println!("Service: {}", plan.service);
        println!("Container: {}", plan.container_name);
        println!("Command: {}", plan.command);
        println!();

        if let Some(output) = &plan.output {
            if !output.is_empty() {
                println!("{output}");
            }
        }

        if let Some(message) = &plan.message {
            println!("{message}");
        }
    }

    if matches!(plan.status, LogsStatus::Failed) {
        return Err(plan
            .message
            .unwrap_or_else(|| "deploy logs failed".to_string()));
    }

    Ok(())
}

fn render_validation_errors(errors: &[ValidationError]) -> String {
    let mut out = String::from("invalid codra.deploy.json:\n");
    for error in errors {
        out.push_str(&format!("- {}: {}\n", error.path, error.message));
    }
    out.trim_end().to_string()
}