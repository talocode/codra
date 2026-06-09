mod cli;
mod config;
mod plan;
mod validator;

pub use cli::{execute_deploy, DeployOutputFormat};
pub use config::{
    DeployConfig, DeployConfigError, DeployPort, DeployServiceConfig, DeployServiceType,
    DeployVersion,
};
pub use plan::{
    generate_plan, DeployPlan, DeployPlanService, DeployPlanUnsupportedFeature, DeployPlanWarning,
};
pub use validator::{validate_config, ValidationError, ValidationResult};

use std::fs;
use std::path::{Path, PathBuf};

pub fn load_config_from_path(path: impl AsRef<Path>) -> Result<DeployConfig, DeployConfigError> {
    let path = path.as_ref();
    let contents = fs::read_to_string(path).map_err(|source| DeployConfigError::Io {
        path: path.to_path_buf(),
        source,
    })?;
    DeployConfig::from_json_str(&contents).map_err(|source| DeployConfigError::Parse {
        path: path.to_path_buf(),
        source,
    })
}

pub fn load_config_from_cwd(filename: &str) -> Result<DeployConfig, DeployConfigError> {
    let path = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(filename);
    load_config_from_path(path)
}
