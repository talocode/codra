use std::collections::HashMap;
use std::process::Command;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DockerCommandOutput {
    pub status: i32,
    pub stdout: String,
    pub stderr: String,
}

impl DockerCommandOutput {
    pub fn success(&self) -> bool {
        self.status == 0
    }
}

pub trait DockerExecutor: Send + Sync {
    fn run(&self, args: &[&str]) -> Result<DockerCommandOutput, String>;
}

pub struct RealDockerExecutor;

impl DockerExecutor for RealDockerExecutor {
    fn run(&self, args: &[&str]) -> Result<DockerCommandOutput, String> {
        if args.is_empty() {
            return Err("empty command".to_string());
        }

        let output = Command::new(args[0])
            .args(&args[1..])
            .output()
            .map_err(|err| err.to_string())?;

        Ok(DockerCommandOutput {
            status: output.status.code().unwrap_or(1),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }
}

#[derive(Debug, Default)]
pub struct MockDockerExecutor {
    responses: HashMap<String, DockerCommandOutput>,
    calls: std::sync::Mutex<Vec<Vec<String>>>,
}

impl MockDockerExecutor {
    pub fn new(responses: HashMap<String, DockerCommandOutput>) -> Self {
        Self {
            responses,
            calls: std::sync::Mutex::new(Vec::new()),
        }
    }

    pub fn calls(&self) -> Vec<Vec<String>> {
        self.calls.lock().unwrap().clone()
    }

    fn key(args: &[&str]) -> String {
        args.join(" ")
    }
}

impl DockerExecutor for MockDockerExecutor {
    fn run(&self, args: &[&str]) -> Result<DockerCommandOutput, String> {
        self.calls
            .lock()
            .unwrap()
            .push(args.iter().map(|arg| (*arg).to_string()).collect());

        let key = Self::key(args);
        if let Some(response) = self.responses.get(&key) {
            return Ok(response.clone());
        }

        Err(format!("unexpected docker command: {key}"))
    }
}