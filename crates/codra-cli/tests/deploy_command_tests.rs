use codra_cli::deploy::execute_deploy_command;
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

fn temp_dir() -> std::path::PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("codra-deploy-test-{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn write_docker_config(dir: &std::path::Path) -> std::path::PathBuf {
    let config = dir.join("codra.deploy.json");
    fs::write(
        &config,
        r#"{
            "version": 1,
            "project": "docker-nextjs",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "env": { "NODE_ENV": "production" },
                    "ports": [{ "internal": 3000, "public": true }]
                },
                {
                    "name": "site",
                    "type": "static",
                    "buildCommand": "npm run build",
                    "publishDir": "dist"
                }
            ]
        }"#,
    )
    .unwrap();
    config
}

#[test]
fn cli_plan_succeeds_for_valid_config() {
    let dir = temp_dir();
    let config = dir.join("codra.deploy.json");
    fs::write(
        &config,
        r#"{
            "version": 1,
            "project": "teraai",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "buildCommand": "npm run build",
                    "startCommand": "npm start",
                    "ports": [{ "internal": 3000, "public": true }]
                }
            ]
        }"#,
    )
    .unwrap();

    let result = execute_deploy_command(&[
        "plan".to_string(),
        "--config".to_string(),
        config.display().to_string(),
    ]);

    assert!(result.is_ok());
}

#[test]
fn cli_plan_fails_for_invalid_config() {
    let dir = temp_dir();
    let config = dir.join("codra.deploy.json");
    fs::write(
        &config,
        r#"{
            "version": 1,
            "project": "",
            "services": [
                { "name": "web", "type": "web" }
            ]
        }"#,
    )
    .unwrap();

    let result = execute_deploy_command(&[
        "plan".to_string(),
        "--config".to_string(),
        config.display().to_string(),
    ]);

    assert!(result.is_err());
}

#[test]
fn cli_up_dry_run_outputs_commands() {
    let dir = temp_dir();
    let config = write_docker_config(&dir);

    let result = execute_deploy_command(&[
        "up".to_string(),
        "--config".to_string(),
        config.display().to_string(),
        "--dry-run".to_string(),
    ]);

    assert!(result.is_ok());
}

#[test]
fn cli_up_execute_without_env_refuses_execution() {
    let dir = temp_dir();
    let config = write_docker_config(&dir);
    std::env::remove_var("CODRA_DEPLOY_ENABLE_EXECUTE");

    let result = execute_deploy_command(&[
        "up".to_string(),
        "--config".to_string(),
        config.display().to_string(),
        "--execute".to_string(),
    ]);

    assert!(result.is_err());
    let message = result.unwrap_err();
    assert!(message.contains("CODRA_DEPLOY_ENABLE_EXECUTE=1"));
}

#[test]
fn cli_up_json_output_shape() {
    let dir = temp_dir();
    let config = write_docker_config(&dir);

    let result = execute_deploy_command(&[
        "up".to_string(),
        "--config".to_string(),
        config.display().to_string(),
        "--json".to_string(),
    ]);

    assert!(result.is_ok());
}

#[test]
fn cli_up_service_filter_works() {
    let dir = temp_dir();
    let config = write_docker_config(&dir);

    let result = execute_deploy_command(&[
        "up".to_string(),
        "--config".to_string(),
        config.display().to_string(),
        "--service".to_string(),
        "web".to_string(),
        "--json".to_string(),
    ]);

    assert!(result.is_ok());
}

#[test]
fn cli_plan_displays_verify_settings() {
    let dir = temp_dir();
    let config = dir.join("codra.deploy.json");
    fs::write(
        &config,
        r#"{
            "version": 1,
            "project": "verify-app",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "ports": [{ "internal": 3000, "public": true }],
                    "verify": {
                        "enabled": true,
                        "url": "https://example.com",
                        "vision": true,
                        "allowWarnings": false
                    }
                }
            ]
        }"#,
    )
    .unwrap();

    let result = execute_deploy_command(&[
        "plan".to_string(),
        "--config".to_string(),
        config.display().to_string(),
    ]);

    assert!(result.is_ok());
}

#[test]
fn cli_up_without_verify_flag_succeeds_for_verify_config() {
    let dir = temp_dir();
    let config = dir.join("codra.deploy.json");
    fs::write(
        &config,
        r#"{
            "version": 1,
            "project": "verify-app",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "ports": [{ "internal": 3000, "public": true }],
                    "verify": {
                        "enabled": true,
                        "url": "https://example.com"
                    }
                }
            ]
        }"#,
    )
    .unwrap();

    let result = execute_deploy_command(&[
        "up".to_string(),
        "--config".to_string(),
        config.display().to_string(),
        "--dry-run".to_string(),
    ]);

    assert!(result.is_ok());
}

#[test]
fn cli_verify_rejects_localhost_without_override() {
    let result = execute_deploy_command(&[
        "verify".to_string(),
        "http://localhost:3000".to_string(),
    ]);

    assert!(result.is_err());
    let message = result.unwrap_err();
    assert!(message.contains("Localhost is disabled"));
}

#[test]
fn cli_verify_requires_url() {
    let result = execute_deploy_command(&["verify".to_string()]);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("URL is required"));
}

#[test]
fn cli_logs_resolves_expected_container_name() {
    let dir = temp_dir();
    let config = write_docker_config(&dir);

    let result = execute_deploy_command(&[
        "logs".to_string(),
        "--config".to_string(),
        config.display().to_string(),
        "--service".to_string(),
        "web".to_string(),
        "--json".to_string(),
    ]);

    assert!(result.is_err());
    let message = result.unwrap_err();
    assert!(
        message.contains("Docker is not available")
            || message.contains("was not found")
            || message.contains("No such container")
    );
}