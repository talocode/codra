use crate::registry::{list_services, ServiceRecord};
use crate::cli::DeployOutputFormat;
use serde::Serialize;
use std::env;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DeployStatusOutput {
    workspace: String,
    registry_exists: bool,
    services: Vec<ServiceRecord>,
}

pub fn execute_status(args: &[String]) -> Result<(), String> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        print_status_help();
        return Ok(());
    }

    let (format, workspace, service_filter) = parse_args(args)?;
    let registry_path = crate::registry::services_registry_path(&workspace);
    let registry_exists = registry_path.exists();
    let mut services = list_services(&workspace).map_err(|err| err.to_string())?;

    if let Some(service_name) = service_filter {
        services.retain(|service| service.service_name == service_name);
    }

    services.sort_by(|left, right| {
        left.project
            .cmp(&right.project)
            .then_with(|| left.service_name.cmp(&right.service_name))
    });

    match format {
        DeployOutputFormat::Human => print_human(&workspace, registry_exists, &services),
        DeployOutputFormat::Json => {
            let body = serde_json::to_string_pretty(&DeployStatusOutput {
                workspace: workspace.display().to_string(),
                registry_exists,
                services,
            })
            .map_err(|err| err.to_string())?;
            println!("{body}");
        }
    }

    Ok(())
}

fn parse_args(args: &[String]) -> Result<(DeployOutputFormat, PathBuf, Option<String>), String> {
    let mut format = DeployOutputFormat::Human;
    let mut workspace = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let mut service_filter = None;
    let mut iter = args.iter().peekable();

    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--json" => format = DeployOutputFormat::Json,
            "--workspace" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --workspace".to_string())?;
                workspace = PathBuf::from(value);
            }
            "--service" => {
                let value = iter
                    .next()
                    .ok_or_else(|| "missing value for --service".to_string())?;
                service_filter = Some(value.to_string());
            }
            flag if flag.starts_with("--") => return Err(format!("unknown flag: {flag}")),
            other => return Err(format!("unexpected argument: {other}")),
        }
    }

    Ok((format, workspace, service_filter))
}

fn print_human(workspace: &PathBuf, registry_exists: bool, services: &[ServiceRecord]) {
    println!("Codra Deploy Status");
    println!();
    println!("Workspace: {}", workspace.display());
    println!("Registry: {}", crate::registry::services_registry_path(workspace).display());
    println!("Registry exists: {}", if registry_exists { "yes" } else { "no" });
    println!("Services: {}", services.len());
    println!();

    if services.is_empty() {
        println!("No deployed services recorded yet.");
        println!("Run `codra deploy up --execute` to create the first deployment record in a later PR.");
        return;
    }

    for service in services {
        println!("{} ({})", service.service_name, service.project);
        println!("  Status: {:?}", service.status);
        println!("  Container: {}", service.container_name);
        println!("  Image: {}", service.image);
        if let Some(host_port) = service.host_port {
            println!("  Host port: {host_port}");
        }
        if let Some(deploy_id) = &service.current_deploy_id {
            println!("  Current deploy: {deploy_id}");
        }
        if let Some(url) = &service.health_check_url {
            println!("  Health URL: {url}");
        } else if let Some(path) = &service.health_check_path {
            println!("  Health path: {path}");
        }
        println!("  Updated: {}", service.updated_at);
        println!();
    }
}

fn print_status_help() {
    println!("codra deploy status [--workspace <path>] [--service <name>] [--json]");
    println!("  Show deployed services from the local .codra/deployments registry.");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_status_args_reads_workspace_service_and_json() {
        let parsed = parse_args(&[
            "--workspace".to_string(),
            "/tmp/workspace".to_string(),
            "--service".to_string(),
            "web".to_string(),
            "--json".to_string(),
        ])
        .expect("parse status args");

        assert_eq!(parsed.0, DeployOutputFormat::Json);
        assert_eq!(parsed.1, PathBuf::from("/tmp/workspace"));
        assert_eq!(parsed.2, Some("web".to_string()));
    }
}