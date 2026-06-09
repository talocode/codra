use crate::config::{DeployConfig, DeployServiceConfig, DeployServiceType};
use crate::docker_exec::DockerExecutor;
use crate::naming::{default_container_name, default_image_name};
use crate::runner::runtime::{
    ExecuteResult, RuntimeMode, RuntimePlan, RuntimeServicePlan, RuntimeStatus, RuntimeWarning,
    SkippedService,
};
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

const STATIC_CRON_SKIP_REASON: &str =
    "runtime execution for static/cron is not implemented yet";

pub struct LocalDockerRunner;

impl LocalDockerRunner {
    pub fn plan_runtime(
        config: &DeployConfig,
        service_filter: Option<&str>,
        config_dir: &Path,
        mode: RuntimeMode,
    ) -> RuntimePlan {
        let mut executable_services = Vec::new();
        let mut skipped_services = Vec::new();
        let mut warnings = Vec::new();

        for service in &config.services {
            if let Some(filter) = service_filter {
                if service.name != filter {
                    continue;
                }
            }

            match service.service_type {
                DeployServiceType::Web | DeployServiceType::Worker => {
                    executable_services.push(build_service_plan(config, service, config_dir));
                }
                DeployServiceType::Static | DeployServiceType::Cron => {
                    skipped_services.push(SkippedService {
                        name: service.name.clone(),
                        service_type: service.service_type.clone(),
                        reason: STATIC_CRON_SKIP_REASON.to_string(),
                    });
                    warnings.push(RuntimeWarning {
                        service: Some(service.name.clone()),
                        message: STATIC_CRON_SKIP_REASON.to_string(),
                    });
                }
            }
        }

        if let Some(filter) = service_filter {
            if !config.services.iter().any(|service| service.name == filter) {
                warnings.push(RuntimeWarning {
                    service: Some(filter.to_string()),
                    message: format!("service '{filter}' was not found in config"),
                });
            }
        }

        let commands = executable_services
            .iter()
            .flat_map(|service| vec![service.build_command.clone(), service.run_command.clone()])
            .collect::<Vec<_>>();

        RuntimePlan {
            project: config.project.clone(),
            mode,
            executable_services,
            skipped_services,
            commands,
            warnings,
            status: RuntimeStatus::Planned,
        }
    }

    pub fn render_commands(plan: &RuntimePlan) -> Vec<String> {
        plan.commands.clone()
    }

    pub fn execute(
        plan: &RuntimePlan,
        executor: &dyn DockerExecutor,
    ) -> Result<ExecuteResult, String> {
        let mut executed_commands = Vec::new();

        for service in &plan.executable_services {
            if container_exists(executor, &service.container_name)? {
                return Err(format!(
                    "container '{}' already exists; rollback and update support is not implemented yet",
                    service.container_name
                ));
            }

            run_build(executor, service, &mut executed_commands)?;
            run_container(executor, service, &plan.project, &mut executed_commands)?;
        }

        Ok(ExecuteResult {
            status: RuntimeStatus::Executed,
            executed_commands,
            message: Some("Docker deployment executed successfully.".to_string()),
        })
    }
}

fn build_service_plan(
    config: &DeployConfig,
    service: &DeployServiceConfig,
    config_dir: &Path,
) -> RuntimeServicePlan {
    let container_name = service
        .container_name
        .clone()
        .unwrap_or_else(|| default_container_name(&config.project, &service.name));
    let image = service
        .image
        .clone()
        .unwrap_or_else(|| default_image_name(&config.project, &service.name));
    let dockerfile = service
        .dockerfile
        .clone()
        .unwrap_or_else(|| "Dockerfile".to_string());
    let context = resolve_context(config_dir, service);

    let env_keys = service.env.keys().cloned().collect::<BTreeSet<_>>();
    let env_args = env_keys
        .iter()
        .map(|key| format!("-e {key}"))
        .collect::<Vec<_>>()
        .join(" ");

    let port_mapping = port_mapping_for_service(service);
    let port_args = port_mapping
        .as_ref()
        .map(|mapping| format!("-p {mapping}"))
        .unwrap_or_default();

    let mut run_parts = vec![
        "docker run -d".to_string(),
        format!("--name {container_name}"),
        format!("--label codra.project={}", config.project),
        format!("--label codra.service={}", service.name),
    ];

    if !port_args.is_empty() {
        run_parts.push(port_args);
    }
    if !env_args.is_empty() {
        run_parts.push(env_args);
    }
    run_parts.push(image.clone());

    let build_command = format!("docker build -f {dockerfile} -t {image} {context}");
    let run_command = run_parts.join(" ");

    RuntimeServicePlan {
        name: service.name.clone(),
        service_type: service.service_type.clone(),
        container_name,
        image,
        dockerfile,
        context,
        port_mapping,
        env_keys: env_keys.into_iter().collect(),
        build_command,
        run_command,
    }
}

fn resolve_context(config_dir: &Path, service: &DeployServiceConfig) -> String {
    let raw = service
        .context
        .clone()
        .unwrap_or_else(|| service.root.clone());
    if raw == "." {
        return config_dir.to_string_lossy().to_string();
    }

    let path = PathBuf::from(&raw);
    if path.is_absolute() {
        raw
    } else {
        config_dir.join(path).to_string_lossy().to_string()
    }
}

fn port_mapping_for_service(service: &DeployServiceConfig) -> Option<String> {
    if !matches!(service.service_type, DeployServiceType::Web) {
        return None;
    }

    let port = service
        .ports
        .iter()
        .find(|port| port.public)
        .map(|port| port.internal)
        .or_else(|| service.ports.first().map(|port| port.internal))?;

    Some(format!("{port}:{port}"))
}

fn container_exists(executor: &dyn DockerExecutor, container_name: &str) -> Result<bool, String> {
    let filter = format!("name=^{container_name}$");
    let output = executor.run(&[
        "docker",
        "ps",
        "-a",
        "--filter",
        &filter,
        "--format",
        "{{.Names}}",
    ])?;

    if !output.success() {
        return Err(output.stderr.trim().to_string());
    }

    Ok(!output.stdout.trim().is_empty())
}

fn run_build(
    executor: &dyn DockerExecutor,
    service: &RuntimeServicePlan,
    executed_commands: &mut Vec<String>,
) -> Result<(), String> {
    let command = service.build_command.clone();
    let output = executor.run(&[
        "docker",
        "build",
        "-f",
        &service.dockerfile,
        "-t",
        &service.image,
        &service.context,
    ])?;
    executed_commands.push(command);

    if output.success() {
        Ok(())
    } else {
        Err(output.stderr.trim().to_string())
    }
}

fn run_container(
    executor: &dyn DockerExecutor,
    service: &RuntimeServicePlan,
    project: &str,
    executed_commands: &mut Vec<String>,
) -> Result<(), String> {
    let command = build_run_command_for_execution(service, project);
    let project_label = format!("codra.project={project}");
    let service_label = format!("codra.service={}", service.name);
    let mut args = vec![
        "docker".to_string(),
        "run".to_string(),
        "-d".to_string(),
        "--name".to_string(),
        service.container_name.clone(),
        "--label".to_string(),
        project_label,
        "--label".to_string(),
        service_label,
    ];

    if let Some(mapping) = service.port_mapping.as_deref() {
        args.push("-p".to_string());
        args.push(mapping.to_string());
    }

    for key in env_keys_for_execution(service) {
        args.push("-e".to_string());
        args.push(key);
    }

    args.push(service.image.clone());

    let argv = args.iter().map(String::as_str).collect::<Vec<_>>();
    let output = executor.run(&argv)?;
    executed_commands.push(command);

    if output.success() {
        Ok(())
    } else {
        Err(output.stderr.trim().to_string())
    }
}

pub fn env_keys_for_execution(service: &RuntimeServicePlan) -> Vec<String> {
    service
        .env_keys
        .iter()
        .filter(|key| std::env::var(key).is_ok())
        .cloned()
        .collect()
}

pub fn build_run_command_for_execution(service: &RuntimeServicePlan, project: &str) -> String {
    let env_args = env_keys_for_execution(service)
        .iter()
        .map(|key| format!("-e {key}"))
        .collect::<Vec<_>>()
        .join(" ");

    let port_args = service
        .port_mapping
        .as_ref()
        .map(|mapping| format!("-p {mapping}"))
        .unwrap_or_default();

    let mut run_parts = vec![
        "docker run -d".to_string(),
        format!("--name {}", service.container_name),
        format!("--label codra.project={project}"),
        format!("--label codra.service={}", service.name),
    ];

    if !port_args.is_empty() {
        run_parts.push(port_args);
    }
    if !env_args.is_empty() {
        run_parts.push(env_args);
    }
    run_parts.push(service.image.clone());
    run_parts.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::docker_exec::{DockerCommandOutput, MockDockerExecutor};
    use std::collections::HashMap;

    fn sample_config() -> DeployConfig {
        serde_json::from_str(
            r#"{
                "version": 1,
                "project": "My App",
                "services": [
                    {
                        "name": "web",
                        "type": "web",
                        "root": ".",
                        "env": { "NODE_ENV": "production", "DATABASE_URL": "secret" },
                        "ports": [{ "internal": 3000, "public": true }]
                    },
                    {
                        "name": "site",
                        "type": "static",
                        "root": ".",
                        "buildCommand": "npm run build",
                        "publishDir": "dist"
                    }
                ]
            }"#,
        )
        .unwrap()
    }

    #[test]
    fn plan_skips_static_with_warning() {
        let plan = LocalDockerRunner::plan_runtime(
            &sample_config(),
            None,
            Path::new("/tmp/app"),
            RuntimeMode::DryRun,
        );
        assert_eq!(plan.executable_services.len(), 1);
        assert_eq!(plan.skipped_services.len(), 1);
        assert_eq!(plan.skipped_services[0].reason, STATIC_CRON_SKIP_REASON);
    }

    #[test]
    fn container_name_is_sanitized() {
        let plan = LocalDockerRunner::plan_runtime(
            &sample_config(),
            Some("web"),
            Path::new("/tmp/app"),
            RuntimeMode::DryRun,
        );
        assert_eq!(plan.executable_services[0].container_name, "codra-my-app-web");
    }

    #[test]
    fn env_values_are_not_in_commands() {
        let plan = LocalDockerRunner::plan_runtime(
            &sample_config(),
            Some("web"),
            Path::new("/tmp/app"),
            RuntimeMode::DryRun,
        );
        let run_command = &plan.executable_services[0].run_command;
        assert!(run_command.contains("-e DATABASE_URL"));
        assert!(run_command.contains("-e NODE_ENV"));
        assert!(!run_command.contains("production"));
        assert!(!run_command.contains("secret"));
    }

    #[test]
    fn execute_fails_when_container_exists() {
        let plan = LocalDockerRunner::plan_runtime(
            &sample_config(),
            Some("web"),
            Path::new("/tmp/app"),
            RuntimeMode::Execute,
        );
        let mut responses = HashMap::new();
        responses.insert(
            "docker ps -a --filter name=^codra-my-app-web$ --format {{.Names}}".to_string(),
            DockerCommandOutput {
                status: 0,
                stdout: "codra-my-app-web\n".to_string(),
                stderr: String::new(),
            },
        );
        let executor = MockDockerExecutor::new(responses);
        let result = LocalDockerRunner::execute(&plan, &executor);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("rollback and update support is not implemented yet"));
    }
}