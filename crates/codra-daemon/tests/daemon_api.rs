use reqwest::Client;
use std::process::{Child, Command};
use std::time::Duration;
use tempfile::tempdir;

struct DaemonGuard {
    child: Child,
    port: u16,
}

impl Drop for DaemonGuard {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

fn start_daemon(port: u16) -> DaemonGuard {
    let child = Command::new("cargo")
        .args(["run", "-p", "codra-daemon", "--", "--host", "127.0.0.1", "--port", &port.to_string()])
        .spawn()
        .expect("failed to start daemon");

    // Give it time to bind
    std::thread::sleep(Duration::from_secs(3));

    DaemonGuard { child, port }
}

#[tokio::test]
async fn health_returns_ok() {
    let guard = start_daemon(4390);
    let client = Client::new();
    let resp = client
        .get(format!("http://127.0.0.1:{}/health", guard.port))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 200);
}

#[tokio::test]
async fn create_task_rejects_empty_prompt() {
    let guard = start_daemon(4391);
    let client = Client::new();
    let resp = client
        .post(format!("http://127.0.0.1:{}/api/tasks", guard.port))
        .json(&serde_json::json!({
            "workspace_path": "/tmp",
            "user_prompt": ""
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 400);
}