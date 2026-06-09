use codra_deploy::{
    execution_enabled, DeployConfig, DockerCommandOutput, LocalDockerRunner, MockDockerExecutor,
    RuntimeMode, RuntimeStatus,
};
use std::collections::HashMap;
use std::path::Path;

fn docker_web_config() -> DeployConfig {
    serde_json::from_str(
        r#"{
            "version": 1,
            "project": "docker-nextjs",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "env": { "NODE_ENV": "production", "DATABASE_URL": "secret" },
                    "ports": [{ "internal": 3000, "public": true }]
                },
                {
                    "name": "site",
                    "type": "static",
                    "buildCommand": "npm run build",
                    "publishDir": "dist"
                },
                {
                    "name": "nightly",
                    "type": "cron",
                    "schedule": "0 0 * * *",
                    "command": "node cron.js"
                }
            ]
        }"#,
    )
    .unwrap()
}

#[test]
fn dry_run_outputs_commands_without_execution() {
    let plan = LocalDockerRunner::plan_runtime(
        &docker_web_config(),
        None,
        Path::new("/tmp/docker-nextjs"),
        RuntimeMode::DryRun,
    );

    assert_eq!(plan.mode, RuntimeMode::DryRun);
    assert_eq!(plan.executable_services.len(), 1);
    assert_eq!(plan.skipped_services.len(), 2);
    assert_eq!(plan.commands.len(), 2);
    assert!(plan.commands[0].starts_with("docker build"));
    assert!(plan.commands[1].starts_with("docker run"));
}

#[test]
fn static_and_cron_are_skipped_with_warning() {
    let plan = LocalDockerRunner::plan_runtime(
        &docker_web_config(),
        None,
        Path::new("/tmp/docker-nextjs"),
        RuntimeMode::DryRun,
    );

    assert!(plan
        .skipped_services
        .iter()
        .all(|service| service.reason.contains("runtime execution for static/cron is not implemented yet")));
    assert!(plan.warnings.iter().any(|warning| warning
        .message
        .contains("runtime execution for static/cron is not implemented yet")));
}

#[test]
fn service_filter_limits_executable_services() {
    let plan = LocalDockerRunner::plan_runtime(
        &docker_web_config(),
        Some("web"),
        Path::new("/tmp/docker-nextjs"),
        RuntimeMode::DryRun,
    );

    assert_eq!(plan.executable_services.len(), 1);
    assert_eq!(plan.executable_services[0].name, "web");
    assert!(plan.skipped_services.is_empty());
}

#[test]
fn env_values_are_redacted_in_commands() {
    let plan = LocalDockerRunner::plan_runtime(
        &docker_web_config(),
        Some("web"),
        Path::new("/tmp/docker-nextjs"),
        RuntimeMode::DryRun,
    );

    let run_command = &plan.executable_services[0].run_command;
    assert!(run_command.contains("-e NODE_ENV"));
    assert!(run_command.contains("-e DATABASE_URL"));
    assert!(!run_command.contains("production"));
    assert!(!run_command.contains("secret"));
}

#[test]
fn execute_uses_mock_executor_without_real_docker() {
    let plan = LocalDockerRunner::plan_runtime(
        &docker_web_config(),
        Some("web"),
        Path::new("/tmp/docker-nextjs"),
        RuntimeMode::Execute,
    );

    let mut responses = HashMap::new();
    responses.insert(
        "docker ps -a --filter name=^codra-docker-nextjs-web$ --format {{.Names}}".to_string(),
        DockerCommandOutput {
            status: 0,
            stdout: String::new(),
            stderr: String::new(),
        },
    );
    responses.insert(
        "docker build -f Dockerfile -t codra-docker-nextjs-web:latest /tmp/docker-nextjs".to_string(),
        DockerCommandOutput {
            status: 0,
            stdout: "built".to_string(),
            stderr: String::new(),
        },
    );
    responses.insert(
        "docker run -d --name codra-docker-nextjs-web --label codra.project=docker-nextjs --label codra.service=web -p 3000:3000 codra-docker-nextjs-web:latest".to_string(),
        DockerCommandOutput {
            status: 0,
            stdout: "container-id".to_string(),
            stderr: String::new(),
        },
    );

    let executor = MockDockerExecutor::new(responses);
    let result = LocalDockerRunner::execute(&plan, &executor).unwrap();
    assert_eq!(result.status, RuntimeStatus::Executed);
    assert_eq!(executor.calls().len(), 3);
}

#[test]
fn execution_enabled_requires_env_var() {
    std::env::remove_var("CODRA_DEPLOY_ENABLE_EXECUTE");
    assert!(!execution_enabled(true));
    assert!(!execution_enabled(false));
}