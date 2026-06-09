use codra_deploy::{generate_plan, validate_config, DeployConfig};

fn valid_web_config() -> DeployConfig {
    serde_json::from_str(
        r#"{
            "version": 1,
            "project": "web-app",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "root": ".",
                    "buildCommand": "npm run build",
                    "startCommand": "npm start",
                    "healthCheckPath": "/",
                    "env": { "NODE_ENV": "production" },
                    "ports": [{ "internal": 3000, "public": true }]
                }
            ]
        }"#,
    )
    .unwrap()
}

fn valid_static_config() -> DeployConfig {
    serde_json::from_str(
        r#"{
            "version": 1,
            "project": "static-app",
            "services": [
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

fn valid_worker_config() -> DeployConfig {
    serde_json::from_str(
        r#"{
            "version": 1,
            "project": "worker-app",
            "services": [
                {
                    "name": "worker",
                    "type": "worker",
                    "root": ".",
                    "startCommand": "node worker.js",
                    "env": { "QUEUE_NAME": "jobs" }
                }
            ]
        }"#,
    )
    .unwrap()
}

#[test]
fn valid_web_service_config() {
    let result = validate_config(&valid_web_config());
    assert!(result.valid);
    assert!(result.errors.is_empty());
}

#[test]
fn valid_static_service_config() {
    let result = validate_config(&valid_static_config());
    assert!(result.valid);
}

#[test]
fn valid_worker_service_config() {
    let result = validate_config(&valid_worker_config());
    assert!(result.valid);
}

#[test]
fn invalid_missing_project() {
    let mut config = valid_web_config();
    config.project = String::new();
    let result = validate_config(&config);
    assert!(!result.valid);
    assert!(result.errors.iter().any(|error| error.path == "project"));
}

#[test]
fn invalid_duplicate_service_names() {
    let config: DeployConfig = serde_json::from_str(
        r#"{
            "version": 1,
            "project": "dup-app",
            "services": [
                { "name": "web", "type": "web", "startCommand": "npm start" },
                { "name": "web", "type": "worker", "startCommand": "node worker.js" }
            ]
        }"#,
    )
    .unwrap();
    let result = validate_config(&config);
    assert!(!result.valid);
    assert!(result
        .errors
        .iter()
        .any(|error| error.message.contains("duplicate service name")));
}

#[test]
fn invalid_unsupported_service_type_is_rejected_by_parser() {
    let parsed = serde_json::from_str::<DeployConfig>(
        r#"{
            "version": 1,
            "project": "bad",
            "services": [
                { "name": "x", "type": "database" }
            ]
        }"#,
    );
    assert!(parsed.is_err());
}

#[test]
fn env_redaction_keeps_keys_but_not_values() {
    let plan = generate_plan(&valid_worker_config());
    let service = &plan.services[0];
    assert_eq!(service.env_keys, vec!["QUEUE_NAME".to_string()]);
    assert_eq!(
        service.redacted_env,
        vec!["QUEUE_NAME=<redacted>".to_string()]
    );
}

#[test]
fn deploy_plan_generation_includes_expected_fields() {
    let plan = generate_plan(&valid_web_config());
    let service = &plan.services[0];
    assert_eq!(plan.project, "web-app");
    assert_eq!(service.name, "web");
    assert_eq!(service.expected_port, Some(3000));
    assert_eq!(service.health_check_path.as_deref(), Some("/"));
    assert_eq!(service.start_command.as_deref(), Some("npm start"));
}

#[test]
fn docker_fields_are_optional_and_preserve_old_configs() {
    let config: DeployConfig = serde_json::from_str(
        r#"{
            "version": 1,
            "project": "legacy-app",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "ports": [{ "internal": 3000, "public": true }]
                }
            ]
        }"#,
    )
    .unwrap();

    let result = validate_config(&config);
    assert!(result.valid);
}

#[test]
fn invalid_container_name_is_rejected() {
    let config: DeployConfig = serde_json::from_str(
        r#"{
            "version": 1,
            "project": "bad-name",
            "services": [
                {
                    "name": "web",
                    "type": "web",
                    "startCommand": "npm start",
                    "containerName": "Bad_Name",
                    "ports": [{ "internal": 3000, "public": true }]
                }
            ]
        }"#,
    )
    .unwrap();

    let result = validate_config(&config);
    assert!(!result.valid);
    assert!(result.errors.iter().any(|error| error.path.ends_with("containerName")));
}
