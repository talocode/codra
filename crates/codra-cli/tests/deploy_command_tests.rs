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
