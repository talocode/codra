use crate::config::DeployServiceType;
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeMode {
    DryRun,
    Execute,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeStatus {
    Planned,
    Executed,
    Failed,
    Refused,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct RuntimeServicePlan {
    pub name: String,
    #[serde(rename = "type")]
    pub service_type: DeployServiceType,
    pub container_name: String,
    pub image: String,
    pub dockerfile: String,
    pub context: String,
    pub port_mapping: Option<String>,
    pub env_keys: Vec<String>,
    pub build_command: String,
    pub run_command: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SkippedService {
    pub name: String,
    #[serde(rename = "type")]
    pub service_type: DeployServiceType,
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct RuntimeWarning {
    pub service: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct RuntimePlan {
    pub project: String,
    pub mode: RuntimeMode,
    pub executable_services: Vec<RuntimeServicePlan>,
    pub skipped_services: Vec<SkippedService>,
    pub commands: Vec<String>,
    pub warnings: Vec<RuntimeWarning>,
    pub status: RuntimeStatus,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ExecuteResult {
    pub status: RuntimeStatus,
    pub executed_commands: Vec<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LogsPlan {
    pub project: String,
    pub service: String,
    pub container_name: String,
    pub tail: u32,
    pub command: String,
    pub output: Option<String>,
    pub status: LogsStatus,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum LogsStatus {
    Planned,
    Executed,
    Failed,
}