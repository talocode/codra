use crate::docker_exec::DockerExecutor;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DockerAvailability {
    pub available: bool,
    pub version: Option<String>,
    pub message: String,
}

pub fn detect_docker_available() -> DockerAvailability {
    detect_docker_available_with(&crate::docker_exec::RealDockerExecutor)
}

pub fn detect_docker_available_with(executor: &dyn DockerExecutor) -> DockerAvailability {
    match executor.run(&["docker", "version", "--format", "{{.Server.Version}}"]) {
        Ok(output) if output.success() => {
            let version = output.stdout.trim();
            let version = if version.is_empty() {
                None
            } else {
                Some(version.to_string())
            };
            DockerAvailability {
                available: true,
                version,
                message: "Docker is available.".to_string(),
            }
        }
        Ok(output) => DockerAvailability {
            available: false,
            version: None,
            message: format!(
                "Docker is not available: {}",
                output.stderr.trim()
            ),
        },
        Err(err) => DockerAvailability {
            available: false,
            version: None,
            message: format!("Docker is not available: {err}"),
        },
    }
}

pub fn get_docker_version_with(executor: &dyn DockerExecutor) -> Option<String> {
    detect_docker_available_with(executor).version
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::docker_exec::{DockerCommandOutput, MockDockerExecutor};
    use std::collections::HashMap;

    #[test]
    fn detects_docker_when_version_succeeds() {
        let mut responses = HashMap::new();
        responses.insert(
            "docker version --format {{.Server.Version}}".to_string(),
            DockerCommandOutput {
                status: 0,
                stdout: "27.0.0\n".to_string(),
                stderr: String::new(),
            },
        );
        let executor = MockDockerExecutor::new(responses);
        let availability = detect_docker_available_with(&executor);
        assert!(availability.available);
        assert_eq!(availability.version.as_deref(), Some("27.0.0"));
    }

    #[test]
    fn reports_unavailable_when_docker_missing() {
        let executor = MockDockerExecutor::new(HashMap::new());
        let availability = detect_docker_available_with(&executor);
        assert!(!availability.available);
        assert!(availability.message.contains("not available"));
    }
}