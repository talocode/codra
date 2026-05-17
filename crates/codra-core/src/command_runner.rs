use codra_protocol::CommandRun;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

pub trait CommandRunner {
    fn run(&self, command: &str, cwd: &Path, timeout: Duration) -> Result<CommandRun, String>;
}

pub struct RealCommandRunner;

impl CommandRunner for RealCommandRunner {
    fn run(&self, command: &str, cwd: &Path, _timeout: Duration) -> Result<CommandRun, String> {
        let start = Instant::now();

        let output = Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| e.to_string())?;

        let duration = start.elapsed();

        Ok(CommandRun {
            command: command.to_string(),
            cwd: cwd.to_string_lossy().to_string(),
            status: if output.status.success() {
                "success".to_string()
            } else {
                "failed".to_string()
            },
            exit_code: output.status.code(),
            stdout_preview: Some(
                String::from_utf8_lossy(&output.stdout)
                    .chars()
                    .take(500)
                    .collect(),
            ),
            stderr_preview: if output.stderr.is_empty() {
                None
            } else {
                Some(
                    String::from_utf8_lossy(&output.stderr)
                        .chars()
                        .take(500)
                        .collect(),
                )
            },
        })
    }
}

pub struct MockCommandRunner {
    pub should_succeed: bool,
}

impl MockCommandRunner {
    pub fn new(should_succeed: bool) -> Self {
        Self { should_succeed }
    }
}

impl CommandRunner for MockCommandRunner {
    fn run(&self, command: &str, cwd: &Path, _timeout: Duration) -> Result<CommandRun, String> {
        Ok(CommandRun {
            command: command.to_string(),
            cwd: cwd.to_string_lossy().to_string(),
            status: if self.should_succeed {
                "success".to_string()
            } else {
                "failed".to_string()
            },
            exit_code: if self.should_succeed {
                Some(0)
            } else {
                Some(1)
            },
            stdout_preview: Some("Mock execution".to_string()),
            stderr_preview: if self.should_succeed {
                None
            } else {
                Some("Mock failure".to_string())
            },
        })
    }
}
