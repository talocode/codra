use crate::config::{
    DeployConfig, DeployServiceConfig, DeployServiceType, DeployServiceVerifyConfig,
};
use serde::Serialize;
use std::collections::BTreeSet;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DeployPlan {
    pub project: String,
    pub services: Vec<DeployPlanService>,
    pub warnings: Vec<DeployPlanWarning>,
    pub unsupported_features: Vec<DeployPlanUnsupportedFeature>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DeployPlanService {
    pub name: String,
    #[serde(rename = "type")]
    pub service_type: DeployServiceType,
    pub root: String,
    pub build_command: Option<String>,
    pub start_command: Option<String>,
    pub expected_port: Option<u16>,
    pub health_check_path: Option<String>,
    pub required_env_keys: Vec<String>,
    pub env_keys: Vec<String>,
    pub redacted_env: Vec<String>,
    pub schedule: Option<String>,
    pub command: Option<String>,
    pub publish_dir: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verify: Option<DeployPlanVerify>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DeployPlanVerify {
    pub enabled: bool,
    pub url: Option<String>,
    pub vision: bool,
    pub allow_warnings: bool,
    pub screenshot_out: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DeployPlanWarning {
    pub service: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DeployPlanUnsupportedFeature {
    pub service: Option<String>,
    pub feature: String,
}

pub fn generate_plan(config: &DeployConfig) -> DeployPlan {
    let mut warnings = Vec::new();
    let mut unsupported_features = Vec::new();
    let services = config
        .services
        .iter()
        .map(|service| {
            let expected_port = expected_port(service);
            if service.health_check_path.is_none() {
                warnings.push(DeployPlanWarning {
                    service: Some(service.name.clone()),
                    message: "No health check path configured.".to_string(),
                });
            }
            if matches!(service.service_type, DeployServiceType::Web) && service.ports.is_empty() {
                warnings.push(DeployPlanWarning {
                    service: Some(service.name.clone()),
                    message: "No public port configured.".to_string(),
                });
            }
            if matches!(service.service_type, DeployServiceType::Cron) && service.schedule.is_none()
            {
                unsupported_features.push(DeployPlanUnsupportedFeature {
                    service: Some(service.name.clone()),
                    feature: "cron schedule missing".to_string(),
                });
            }
            DeployPlanService {
                name: service.name.clone(),
                service_type: service.service_type.clone(),
                root: service.root.clone(),
                build_command: service.build_command.clone(),
                start_command: service.start_command.clone(),
                expected_port,
                health_check_path: service.health_check_path.clone(),
                required_env_keys: required_env_keys(service),
                env_keys: service.env.keys().cloned().collect(),
                redacted_env: service
                    .env
                    .keys()
                    .map(|key| format!("{key}=<redacted>"))
                    .collect(),
                schedule: service.schedule.clone(),
                command: service.command.clone(),
                publish_dir: service.publish_dir.clone(),
                verify: service.verify.as_ref().map(plan_verify_from_config),
            }
        })
        .collect();

    if config
        .services
        .iter()
        .all(|service| service.health_check_path.is_none())
    {
        warnings.push(DeployPlanWarning {
            service: None,
            message: "No domain configured.".to_string(),
        });
    }

    DeployPlan {
        project: config.project.clone(),
        services,
        warnings,
        unsupported_features,
    }
}

fn required_env_keys(service: &DeployServiceConfig) -> Vec<String> {
    let mut keys = BTreeSet::new();
    if matches!(service.service_type, DeployServiceType::Web) {
        keys.insert("PORT".to_string());
    }
    keys.into_iter().collect()
}

fn plan_verify_from_config(verify: &DeployServiceVerifyConfig) -> DeployPlanVerify {
    DeployPlanVerify {
        enabled: verify.enabled,
        url: verify.url.clone(),
        vision: verify.vision,
        allow_warnings: verify.allow_warnings,
        screenshot_out: verify.screenshot_out.clone(),
    }
}

fn expected_port(service: &DeployServiceConfig) -> Option<u16> {
    service
        .ports
        .iter()
        .find(|port| port.public)
        .map(|port| port.internal)
        .or_else(|| service.ports.first().map(|port| port.internal))
}
