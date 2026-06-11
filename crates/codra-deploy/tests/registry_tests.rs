use codra_deploy::{
    deploy_record_path, deployment_registry_root, empty_services_registry, list_services,
    load_deploy_record, load_services_registry, save_deploy_record, save_services_registry,
    upsert_service_record, DeployRecord, DeployRecordStatus, DeploymentServiceStatus,
    RegistryError, ServiceRecord, REGISTRY_VERSION,
};
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

fn temp_workspace() -> std::path::PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("codra-deploy-registry-{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn sample_service_record(project: &str, service: &str, updated_at: &str) -> ServiceRecord {
    ServiceRecord {
        service_name: service.to_string(),
        project: project.to_string(),
        container_name: format!("codra-{project}-{service}"),
        image: format!("codra-{project}-{service}:latest"),
        host_port: Some(3000),
        internal_port: Some(3000),
        current_deploy_id: Some("deploy_test_001".to_string()),
        status: DeploymentServiceStatus::Running,
        health_check_path: Some("/api/health".to_string()),
        health_check_url: Some("http://localhost:3000/api/health".to_string()),
        created_at: updated_at.to_string(),
        updated_at: updated_at.to_string(),
    }
}

#[test]
fn empty_registry_is_returned_when_services_file_missing() {
    let workspace = temp_workspace();
    let registry = load_services_registry(&workspace).expect("load empty registry");

    assert_eq!(registry.version, REGISTRY_VERSION);
    assert!(registry.services.is_empty());
}

#[test]
fn save_and_load_services_registry_round_trips() {
    let workspace = temp_workspace();
    let timestamp = "2026-06-11T00:00:00Z".to_string();
    let mut registry = empty_services_registry();
    registry.updated_at = timestamp.clone();
    registry.services.push(sample_service_record("launchpix", "web", &timestamp));

    save_services_registry(&workspace, &registry).expect("save services registry");
    let loaded = load_services_registry(&workspace).expect("load services registry");

    assert_eq!(loaded.version, REGISTRY_VERSION);
    assert_eq!(loaded.updated_at, timestamp);
    assert_eq!(loaded.services.len(), 1);
    assert_eq!(loaded.services[0].service_name, "web");
    assert_eq!(loaded.services[0].project, "launchpix");
    assert_eq!(loaded.services[0].container_name, "codra-launchpix-web");
}

#[test]
fn upsert_service_record_updates_existing_service() {
    let workspace = temp_workspace();
    let first = sample_service_record("launchpix", "web", "2026-06-11T00:00:00Z");
    upsert_service_record(&workspace, first).expect("insert service");

    let mut updated = sample_service_record("launchpix", "web", "2026-06-11T01:00:00Z");
    updated.status = DeploymentServiceStatus::Stopped;
    updated.host_port = Some(3100);
    upsert_service_record(&workspace, updated).expect("update service");

    let services = list_services(&workspace).expect("list services");
    assert_eq!(services.len(), 1);
    assert_eq!(services[0].status, DeploymentServiceStatus::Stopped);
    assert_eq!(services[0].host_port, Some(3100));
}

#[test]
fn save_and_load_deploy_record_round_trips() {
    let workspace = temp_workspace();
    let record = DeployRecord {
        deploy_id: "deploy_test_001".to_string(),
        service_name: "web".to_string(),
        project: "launchpix".to_string(),
        container_name: "codra-launchpix-web".to_string(),
        image: "codra-launchpix-web:latest".to_string(),
        host_port: Some(3000),
        internal_port: Some(3000),
        status: DeployRecordStatus::Running,
        config_path: Some("codra.deploy.json".to_string()),
        health_check_path: Some("/api/health".to_string()),
        health_check_url: Some("http://localhost:3000/api/health".to_string()),
        created_at: "2026-06-11T00:00:00Z".to_string(),
        updated_at: "2026-06-11T00:00:00Z".to_string(),
    };

    save_deploy_record(&workspace, &record).expect("save deploy record");
    let loaded = load_deploy_record(&workspace, "deploy_test_001").expect("load deploy record");

    assert_eq!(loaded.deploy_id, "deploy_test_001");
    assert_eq!(loaded.status, DeployRecordStatus::Running);
    assert_eq!(loaded.config_path.as_deref(), Some("codra.deploy.json"));
}

#[test]
fn deploy_record_path_rejects_invalid_ids() {
    let workspace = temp_workspace();
    let result = deploy_record_path(&workspace, "../escape");
    assert!(matches!(result, Err(RegistryError::InvalidDeployId(_))));
}

#[test]
fn deployment_registry_paths_follow_expected_layout() {
    let workspace = temp_workspace();
    assert_eq!(
        deployment_registry_root(&workspace),
        workspace.join(".codra/deployments")
    );
    assert_eq!(
        codra_deploy::services_registry_path(&workspace),
        workspace.join(".codra/deployments/services.json")
    );
    assert_eq!(
        deploy_record_path(&workspace, "deploy_test_001").expect("valid deploy id"),
        workspace.join(".codra/deployments/deploys/deploy_test_001.json")
    );
}