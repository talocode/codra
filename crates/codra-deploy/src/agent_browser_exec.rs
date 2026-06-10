use std::collections::HashMap;
use std::io;
use std::process::Command;
use std::sync::Mutex;

pub const AGENT_BROWSER_INSTALL_MESSAGE: &str = "agent-browser is not installed.\n\
Install it with: npm install -g @talocode/agent-browser\n\
Or use the GitHub Action: talocode/agent-browser@v0";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AgentBrowserCommandOutput {
    pub status: i32,
    pub stdout: String,
    pub stderr: String,
}

impl AgentBrowserCommandOutput {
    pub fn success(&self) -> bool {
        self.status == 0
    }
}

pub trait AgentBrowserExecutor: Send + Sync {
    fn run(&self, binary: &str, args: &[String]) -> Result<AgentBrowserCommandOutput, String>;
}

pub struct RealAgentBrowserExecutor;

impl AgentBrowserExecutor for RealAgentBrowserExecutor {
    fn run(&self, binary: &str, args: &[String]) -> Result<AgentBrowserCommandOutput, String> {
        let output = Command::new(binary).args(args).output().map_err(|err| {
            if err.kind() == io::ErrorKind::NotFound {
                AGENT_BROWSER_INSTALL_MESSAGE.to_string()
            } else {
                err.to_string()
            }
        })?;

        Ok(AgentBrowserCommandOutput {
            status: output.status.code().unwrap_or(1),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }
}

#[derive(Debug, Default)]
pub struct MockAgentBrowserExecutor {
    responses: HashMap<String, Result<AgentBrowserCommandOutput, String>>,
    calls: Mutex<Vec<(String, Vec<String>)>>,
}

impl MockAgentBrowserExecutor {
    pub fn new(responses: HashMap<String, Result<AgentBrowserCommandOutput, String>>) -> Self {
        Self {
            responses,
            calls: Mutex::new(Vec::new()),
        }
    }

    pub fn calls(&self) -> Vec<(String, Vec<String>)> {
        self.calls.lock().unwrap().clone()
    }

    fn key(binary: &str, args: &[String]) -> String {
        format!("{binary} {}", args.join(" "))
    }
}

impl AgentBrowserExecutor for MockAgentBrowserExecutor {
    fn run(&self, binary: &str, args: &[String]) -> Result<AgentBrowserCommandOutput, String> {
        self.calls
            .lock()
            .unwrap()
            .push((binary.to_string(), args.to_vec()));

        let key = Self::key(binary, args);
        self.responses
            .get(&key)
            .cloned()
            .unwrap_or_else(|| Err(format!("unexpected agent-browser command: {key}")))
    }
}