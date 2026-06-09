mod cli;
mod config;
mod docker_availability;
mod docker_exec;
mod naming;
mod plan;
mod runner;
mod validator;

pub use cli::{execute_deploy, execution_enabled, DeployOutputFormat};
pub use config::{
    DeployConfig, DeployConfigError, DeployPort, DeployServiceConfig, DeployServiceType,
    DeployVersion,
};
pub use docker_availability::{detect_docker_available, get_docker_version_with, DockerAvailability};
pub use docker_exec::{
    DockerCommandOutput, DockerExecutor, MockDockerExecutor, RealDockerExecutor,
};
pub use naming::{
    default_container_name, default_image_name, is_valid_container_name, sanitize_segment,
};
pub use plan::{
    generate_plan, DeployPlan, DeployPlanService, DeployPlanUnsupportedFeature, DeployPlanWarning,
};
pub use runner::{
    ExecuteResult, LocalDockerRunner, LogsPlan, LogsStatus, RuntimeMode, RuntimePlan,
    RuntimeServicePlan, RuntimeStatus, RuntimeWarning, SkippedService,
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