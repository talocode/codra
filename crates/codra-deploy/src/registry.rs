use serde::{Deserialize, Serialize};
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};

pub const REGISTRY_VERSION: u32 = 1;
pub const DEPLOYMENTS_DIR: &str = ".codra/deployments";
pub const SERVICES_REGISTRY_FILE: &str = "services.json";
pub const DEPLOYS_SUBDIR: &str = "deploys";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeploymentServiceStatus {
    Running,
    Stopped,
    Failed,
    Unknown,
    Planned,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeployRecordStatus {
    Running,
    Stopped,
    Failed,
    Unknown,
    Planned,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceRecord {
    pub service_name: String,
    pub project: String,
    pub container_name: String,
    pub image: String,
    #[serde(default)]
    pub host_port: Option<u16>,
    #[serde(default)]
    pub internal_port: Option<u16>,
    #[serde(default)]
    pub current_deploy_id: Option<String>,
    pub status: DeploymentServiceStatus,
    #[serde(default)]
    pub health_check_path: Option<String>,
    #[serde(default)]
    pub health_check_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeployRecord {
    pub deploy_id: String,
    pub service_name: String,
    pub project: String,
    pub container_name: String,
    pub image: String,
    #[serde(default)]
    pub host_port: Option<u16>,
    #[serde(default)]
    pub internal_port: Option<u16>,
    pub status: DeployRecordStatus,
    #[serde(default)]
    pub config_path: Option<String>,
    #[serde(default)]
    pub health_check_path: Option<String>,
    #[serde(default)]
    pub health_check_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServicesRegistry {
    pub version: u32,
    pub updated_at: String,
    pub services: Vec<ServiceRecord>,
}

#[derive(Debug)]
pub enum RegistryError {
    Io {
        path: PathBuf,
        source: std::io::Error,
    },
    Parse {
        path: PathBuf,
        source: serde_json::Error,
    },
    Serialize(serde_json::Error),
    InvalidDeployId(String),
}

impl fmt::Display for RegistryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RegistryError::Io { path, source } => {
                write!(f, "failed to access {}: {}", path.display(), source)
            }
            RegistryError::Parse { path, source } => {
                write!(f, "failed to parse {}: {}", path.display(), source)
            }
            RegistryError::Serialize(source) => {
                write!(f, "failed to serialize registry: {source}")
            }
            RegistryError::InvalidDeployId(value) => {
                write!(f, "invalid deploy id: {value}")
            }
        }
    }
}

impl std::error::Error for RegistryError {}

pub fn deployment_registry_root(workspace: impl AsRef<Path>) -> PathBuf {
    workspace.as_ref().join(DEPLOYMENTS_DIR)
}

pub fn services_registry_path(workspace: impl AsRef<Path>) -> PathBuf {
    deployment_registry_root(workspace).join(SERVICES_REGISTRY_FILE)
}

pub fn deploy_record_path(workspace: impl AsRef<Path>, deploy_id: &str) -> Result<PathBuf, RegistryError> {
    validate_deploy_id(deploy_id)?;
    Ok(deployment_registry_root(workspace)
        .join(DEPLOYS_SUBDIR)
        .join(format!("{deploy_id}.json")))
}

pub fn load_services_registry(workspace: impl AsRef<Path>) -> Result<ServicesRegistry, RegistryError> {
    let path = services_registry_path(&workspace);
    if !path.exists() {
        return Ok(empty_services_registry());
    }

    let contents = fs::read_to_string(&path).map_err(|source| RegistryError::Io {
        path: path.clone(),
        source,
    })?;
    serde_json::from_str(&contents).map_err(|source| RegistryError::Parse { path, source })
}

pub fn save_services_registry(
    workspace: impl AsRef<Path>,
    registry: &ServicesRegistry,
) -> Result<(), RegistryError> {
    let path = services_registry_path(&workspace);
    ensure_parent_dir(&path)?;
    let body = serde_json::to_string_pretty(registry).map_err(RegistryError::Serialize)?;
    fs::write(&path, body).map_err(|source| RegistryError::Io {
        path,
        source,
    })
}

pub fn load_deploy_record(
    workspace: impl AsRef<Path>,
    deploy_id: &str,
) -> Result<DeployRecord, RegistryError> {
    let path = deploy_record_path(workspace, deploy_id)?;
    let contents = fs::read_to_string(&path).map_err(|source| RegistryError::Io {
        path: path.clone(),
        source,
    })?;
    serde_json::from_str(&contents).map_err(|source| RegistryError::Parse { path, source })
}

pub fn save_deploy_record(workspace: impl AsRef<Path>, record: &DeployRecord) -> Result<(), RegistryError> {
    validate_deploy_id(&record.deploy_id)?;
    let path = deploy_record_path(workspace, &record.deploy_id)?;
    ensure_parent_dir(&path)?;
    let body = serde_json::to_string_pretty(record).map_err(RegistryError::Serialize)?;
    fs::write(&path, body).map_err(|source| RegistryError::Io {
        path,
        source,
    })
}

pub fn upsert_service_record(
    workspace: impl AsRef<Path>,
    record: ServiceRecord,
) -> Result<ServicesRegistry, RegistryError> {
    let mut registry = load_services_registry(&workspace)?;
    registry.updated_at = record.updated_at.clone();

    if let Some(existing) = registry
        .services
        .iter_mut()
        .find(|service| service.service_name == record.service_name && service.project == record.project)
    {
        *existing = record;
    } else {
        registry.services.push(record);
    }

    save_services_registry(&workspace, &registry)?;
    Ok(registry)
}

pub fn list_services(workspace: impl AsRef<Path>) -> Result<Vec<ServiceRecord>, RegistryError> {
    Ok(load_services_registry(workspace)?.services)
}

pub fn empty_services_registry() -> ServicesRegistry {
    ServicesRegistry {
        version: REGISTRY_VERSION,
        updated_at: String::new(),
        services: Vec::new(),
    }
}

fn ensure_parent_dir(path: &Path) -> Result<(), RegistryError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|source| RegistryError::Io {
            path: parent.to_path_buf(),
            source,
        })?;
    }
    Ok(())
}

fn validate_deploy_id(deploy_id: &str) -> Result<(), RegistryError> {
    let valid = !deploy_id.is_empty()
        && deploy_id.len() <= 128
        && deploy_id
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_');

    if valid {
        Ok(())
    } else {
        Err(RegistryError::InvalidDeployId(deploy_id.to_string()))
    }
}