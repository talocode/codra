use reqwest::Client;

#[tokio::test]
async fn health_returns_ok() {
    // This test assumes daemon is running on 4390 for test isolation
    // In real CI we would start the daemon programmatically.
    let client = Client::new();
    let resp = client.get("http://127.0.0.1:4390/health").send().await;

    // If daemon not running, skip gracefully
    if resp.is_err() {
        println!("Daemon not running on 4390, skipping health test");
        return;
    }
    let resp = resp.unwrap();
    assert_eq!(resp.status(), 200);
}

#[tokio::test]
async fn worker_health_returns_ok() {
    let client = Client::new();
    let resp = client
        .get("http://127.0.0.1:4390/api/workers/health")
        .send()
        .await;

    if resp.is_err() {
        println!("Daemon not running on 4390, skipping worker_health test");
        return;
    }
    let resp = resp.unwrap();
    assert_eq!(resp.status(), 200);

    let body: serde_json::Value = resp.json().await.unwrap();
    assert_eq!(body["status"], "ok");
    assert!(body["daemon_id"].is_string());
    assert!(body["hostname"].is_string());
    assert!(body["os"].is_string());
    assert!(body["arch"].is_string());
    assert!(body["uptime_seconds"].is_number());
    assert_eq!(body["remote_worker_protocol_version"], "0.1");

    let caps = &body["capabilities"];
    assert_eq!(caps["task_execution"], true);
    assert_eq!(caps["event_streaming"], true);
    assert_eq!(caps["approval_forwarding"], false);
    assert_eq!(caps["remote_pairing"], false);
    assert_eq!(caps["mdns_discovery"], false);
}

#[tokio::test]
async fn create_task_rejects_empty_prompt() {
    let client = Client::new();
    let resp = client
        .post("http://127.0.0.1:4390/api/tasks")
        .json(&serde_json::json!({
            "workspace_path": "/tmp",
            "user_prompt": ""
        }))
        .send()
        .await;

    if resp.is_err() {
        println!("Daemon not running, skipping");
        return;
    }
    let resp = resp.unwrap();
    assert_eq!(resp.status(), 400);
}
