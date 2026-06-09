use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fmt;
use std::path::PathBuf;

pub type DeployVersion = u32;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeployServiceType {
    Web,
    Worker,
    Cron,
    Static,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DeployPort {
    pub internal: u16,
    #[serde(default)]
    pub public: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DeployServiceConfig {
    pub name: String,
    #[serde(rename = "type")]
    pub service_type: DeployServiceType,
    #[serde(default = "default_root")]
    pub root: String,
    #[serde(rename = "buildCommand", default)]
    pub build_command: Option<String>,
    #[serde(rename = "startCommand", default)]
    pub start_command: Option<String>,
    #[serde(rename = "publishDir", default)]
    pub publish_dir: Option<String>,
    #[serde(default)]
    pub schedule: Option<String>,
    #[serde(default)]
    pub command: Option<String>,
    #[serde(rename = "healthCheckPath", default)]
    pub health_check_path: Option<String>,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    #[serde(default)]
    pub ports: Vec<DeployPort>,
    #[serde(default)]
    pub dockerfile: Option<String>,
    #[serde(default)]
    pub context: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(rename = "containerName", default)]
    pub container_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DeployConfig {
    pub version: DeployVersion,
    pub project: String,
    pub services: Vec<DeployServiceConfig>,
}

#[derive(Debug)]
pub enum DeployConfigError {
    Io {
        path: PathBuf,
        source: std::io::Error,
    },
    Parse {
        path: PathBuf,
        source: serde_json::Error,
    },
}

impl fmt::Display for DeployConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DeployConfigError::Io { path, source } => {
                write!(f, "failed to read {}: {}", path.display(), source)
            }
            DeployConfigError::Parse { path, source } => {
                write!(f, "failed to parse {}: {}", path.display(), source)
            }
        }
    }
}

impl std::error::Error for DeployConfigError {}

impl DeployConfig {
    pub fn from_json_str(source: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(source)
    }
}

fn default_root() -> String {
    ".".to_string()
}
