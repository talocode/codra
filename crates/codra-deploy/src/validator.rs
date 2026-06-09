use crate::config::{DeployConfig, DeployServiceType};
use serde::Serialize;
use std::collections::BTreeSet;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ValidationError {
    pub path: String,
    pub message: String,
}

pub fn validate_config(config: &DeployConfig) -> ValidationResult {
    let mut errors = Vec::new();

    if config.project.trim().is_empty() {
        errors.push(ValidationError {
            path: "project".to_string(),
            message: "project name is required".to_string(),
        });
    }

    if config.services.is_empty() {
        errors.push(ValidationError {
            path: "services".to_string(),
            message: "at least one service is required".to_string(),
        });
    }

    let mut names = BTreeSet::new();
    for (index, service) in config.services.iter().enumerate() {
        let base = format!("services[{index}]");
        if service.name.trim().is_empty() {
            errors.push(ValidationError {
                path: format!("{base}.name"),
                message: "service name is required".to_string(),
            });
        } else if !names.insert(service.name.clone()) {
            errors.push(ValidationError {
                path: format!("{base}.name"),
                message: format!("duplicate service name: {}", service.name),
            });
        }

        if matches!(service.service_type, DeployServiceType::Web) && service.start_command.is_none()
        {
            errors.push(ValidationError {
                path: format!("{base}.startCommand"),
                message: "web services require startCommand".to_string(),
            });
        }

        if matches!(service.service_type, DeployServiceType::Static)
            && service.build_command.is_none()
            && service.publish_dir.is_none()
        {
            errors.push(ValidationError {
                path: format!("{base}.buildCommand"),
                message: "static services require buildCommand or publishDir".to_string(),
            });
        }

        if matches!(service.service_type, DeployServiceType::Cron)
            && service.schedule.as_deref().unwrap_or("").trim().is_empty()
        {
            errors.push(ValidationError {
                path: format!("{base}.schedule"),
                message: "cron services require schedule".to_string(),
            });
        }

        if matches!(service.service_type, DeployServiceType::Cron)
            && service.command.as_deref().unwrap_or("").trim().is_empty()
        {
            errors.push(ValidationError {
                path: format!("{base}.command"),
                message: "cron services require command".to_string(),
            });
        }
    }

    ValidationResult {
        valid: errors.is_empty(),
        errors,
    }
}
