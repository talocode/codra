use codra_core::provider::{create_provider, EchoMockProvider, IntelligenceProvider};
use codra_core::provider_config::ProviderConfigService;
use codra_protocol::{McpServerInfo, ProviderConfig, ProviderKind};
use codra_runtime::{StoredPairing, TrustLevel, WorkerHealth, WorkerId, WorkerStore};
use codra_tools::design::load_design_system;
use codra_tools::registry::builtin_tool_definitions;
use std::env;
use std::io::{self, Write};
use std::path::PathBuf;

fn main() {
    let mut args = env::args().skip(1).collect::<Vec<_>>();
    let command = args.first().map(String::as_str).unwrap_or("help");
    let result = match command {
        "smoke" => smoke(),
        "provider" => {
            args.remove(0);
            if args.first().map(String::as_str) == Some("check") {
                provider_check()
            } else {
                help()
            }
        }
        "worker" => {
            args.remove(0);
            worker_command(&args)
        }
        "headless" => headless(
            args.get(1)
                .cloned()
                .unwrap_or_else(|| "Inspect workspace and report readiness.".to_string()),
        ),
        "mcp-server" => mcp_server(),
        _ => help(),
    };

    if let Err(err) = result {
        eprintln!("codra: {}", err);
        std::process::exit(1);
    }
}

fn workspace_root() -> PathBuf {
    env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

fn smoke() -> Result<(), String> {
    let root = workspace_root();
    let tools = builtin_tool_definitions();
    let design = load_design_system(&root);
    println!("Codra smoke check");
    println!("workspace: {}", root.display());
    println!("tools: {} registered", tools.len());
    println!(
        "design.md: {}",
        if design.found { "found" } else { "missing" }
    );
    println!(
        "mock provider: {}",
        EchoMockProvider::new().health_check()?.message
    );
    Ok(())
}

fn provider_check() -> Result<(), String> {
    let root = workspace_root();
    let config_service = ProviderConfigService::new(root.to_string_lossy().as_ref());
    let cfg = config_service
        .load_config()
        .unwrap_or_else(default_provider_config);
    let key = env::var("CODRA_API_KEY")
        .ok()
        .or_else(|| config_service.load_api_key());
    let health = create_provider(&cfg, key.as_deref()).health_check()?;
    println!("provider: {:?} / {}", cfg.kind, cfg.model_id);
    println!("status: {:?}", health.status);
    println!("message: {}", health.message);
    Ok(())
}

fn headless(intent: String) -> Result<(), String> {
    let root = workspace_root();
    println!("Codra headless run");
    println!("workspace: {}", root.display());
    println!("intent: {}", intent);
    println!("mode: dry-run planning surface; use desktop app for approval-gated execution");
    println!("tools: {} registered", builtin_tool_definitions().len());
    Ok(())
}

fn mcp_server() -> Result<(), String> {
    let info = McpServerInfo {
        name: "codra".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        tools: builtin_tool_definitions(),
    };
    let json = serde_json::to_string_pretty(&info).map_err(|e| e.to_string())?;
    println!("{}", json);
    let _ = io::stdout().flush();
    Ok(())
}

fn default_provider_config() -> ProviderConfig {
    ProviderConfig {
        kind: ProviderKind::Mock,
        base_url: String::new(),
        model_id: "echo-mock".to_string(),
        api_key_set: false,
        profile_id: "mock".to_string(),
        profile_name: "Offline Mock".to_string(),
    }
}

// ── Worker Commands ──────────────────────────────────────────────

fn worker_command(args: &[String]) -> Result<(), String> {
    let sub = args.first().map(String::as_str).unwrap_or("help");
    match sub {
        "add" => worker_add(&args[1..]),
        "check" | "probe" => worker_check(&args[1..]),
        "list" => worker_list(),
        "remove" => worker_remove(&args[1..]),
        _ => {
            println!("codra worker <command>");
            println!("  add <url> --fingerprint <pin-or-fingerprint>  Register a remote worker");
            println!("  check|probe <worker_id>                      Probe worker health endpoint");
            println!("  list                                        List registered workers");
            println!("  remove <worker_id>                          Remove a registered worker");
            Ok(())
        }
    }
}

fn worker_add(args: &[String]) -> Result<(), String> {
    let url = args.first().ok_or_else(|| {
        "Usage: codra worker add <url> --fingerprint <pin-or-fingerprint>".to_string()
    })?;

    let fingerprint_idx = args
        .iter()
        .position(|a| a == "--fingerprint")
        .ok_or_else(|| "Missing --fingerprint argument".to_string())?;
    let fingerprint = args
        .get(fingerprint_idx + 1)
        .ok_or_else(|| "Missing value for --fingerprint".to_string())?;

    let health_url = format!("{}/api/workers/health", url.trim_end_matches('/'));
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let resp = client
        .get(&health_url)
        .send()
        .map_err(|e| format!("Failed to reach worker at {}: {}", health_url, e))?;

    if !resp.status().is_success() {
        return Err(format!(
            "Worker at {} returned status {}",
            health_url,
            resp.status()
        ));
    }

    let health: serde_json::Value = resp
        .json()
        .map_err(|e| format!("Failed to parse health response: {}", e))?;

    let worker_id = health["worker_id"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();
    let worker_label = health["hostname"]
        .as_str()
        .unwrap_or("remote-worker")
        .to_string();
    let version = health["version"].as_str().unwrap_or("0.0.0").to_string();

    let url_trimmed = url.trim_end_matches('/');
    let (host, port) = parse_worker_url(url_trimmed)?;

    let worker = StoredPairing {
        worker_id: WorkerId(worker_id.clone()),
        worker_label,
        pin_sha256: fingerprint.clone(),
        worker_host: host,
        worker_port: port,
        trust_level: TrustLevel::Standard,
        paired_at: chrono::Utc::now().to_rfc3339(),
        last_seen: chrono::Utc::now().to_rfc3339(),
    };

    let store = WorkerStore::new_global();
    store
        .add_worker(worker)
        .map_err(|e| format!("Failed to register worker: {}", e))?;

    println!("Registered worker:");
    println!("  ID:      {}", worker_id);
    println!("  URL:     {}", url_trimmed);
    println!("  Version: {}", version);
    println!("  Store:   {}", store.file_path().display());

    Ok(())
}

fn worker_list() -> Result<(), String> {
    let store = WorkerStore::new_global();
    let workers = store.list_workers();

    if workers.is_empty() {
        println!("No workers registered.");
        println!("  Use: codra worker add <url> --fingerprint <pin>");
        return Ok(());
    }

    println!("Registered workers ({}):", workers.len());
    for w in &workers {
        println!(
            "  {}  {}  {}  {}:{}  {}",
            w.worker_id.0,
            w.worker_label,
            serde_json::to_value(&w.trust_level)
                .map(|v| v.as_str().unwrap_or("?").to_string())
                .unwrap_or_else(|_| "?".to_string()),
            w.worker_host,
            w.worker_port,
            w.last_seen,
        );
    }
    Ok(())
}

fn worker_remove(args: &[String]) -> Result<(), String> {
    let worker_id = args
        .first()
        .ok_or_else(|| "Usage: codra worker remove <worker_id>".to_string())?;

    let store = WorkerStore::new_global();
    let removed = store
        .remove_worker(&WorkerId(worker_id.clone()))
        .map_err(|e| format!("Failed to remove worker: {}", e))?;

    if removed {
        println!("Removed worker '{}'.", worker_id);
    } else {
        println!("Worker '{}' not found.", worker_id);
    }
    Ok(())
}

fn worker_check(args: &[String]) -> Result<(), String> {
    let worker_id = args
        .first()
        .ok_or_else(|| "Usage: codra worker check <worker_id>".to_string())?;

    let store = WorkerStore::new_global();
    let worker = store
        .get_worker(&WorkerId(worker_id.clone()))
        .ok_or_else(|| format!("Worker '{}' not found in registry", worker_id))?;

    let health_url = format!(
        "http://{}:{}/api/workers/health",
        worker.worker_host, worker.worker_port
    );

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let resp = client.get(&health_url).send().map_err(|e| {
        format!(
            "Failed to reach worker '{}' at {}: {}",
            worker_id, health_url, e
        )
    })?;

    if !resp.status().is_success() {
        return Err(format!(
            "Worker '{}' at {} returned HTTP {}",
            worker_id,
            health_url,
            resp.status()
        ));
    }

    let health: WorkerHealth = resp.json().map_err(|e| {
        format!(
            "Malformed health response from worker '{}': {}",
            worker_id, e
        )
    })?;

    // Verify returned worker_id matches registration
    if health.worker_id.0 != worker_id.clone() {
        return Err(format!(
            "Worker identity mismatch: expected '{}', responded with '{}'",
            worker_id, health.worker_id.0
        ));
    }

    // Update last_seen on successful probe
    store
        .update_last_seen(
            &WorkerId(worker_id.clone()),
            chrono::Utc::now().to_rfc3339(),
        )
        .map_err(|e| format!("Failed to update last_seen: {}", e))?;

    println!("Worker health check: {}", worker_id);
    println!("  status:              {}", health.status);
    println!("  daemon version:      {}", health.version);
    println!("  os / arch:           {} / {}", health.os, health.arch);
    println!("  uptime:              {}s", health.uptime_seconds);
    println!("  workspace mode:      {}", health.workspace_mode);
    println!(
        "  protocol version:    {}",
        health.remote_worker_protocol_version
    );
    println!("  capabilities:");
    println!(
        "    task_execution:    {}",
        yesno(health.capabilities.task_execution)
    );
    println!(
        "    event_streaming:   {}",
        yesno(health.capabilities.event_streaming)
    );
    println!(
        "    remote_pairing:    {}",
        yesno(health.capabilities.remote_pairing)
    );
    println!(
        "    approval_fwd:      {}",
        yesno(health.capabilities.approval_forwarding)
    );
    println!(
        "    mdns_discovery:    {}",
        yesno(health.capabilities.mdns_discovery)
    );

    Ok(())
}

fn yesno(v: bool) -> &'static str {
    if v {
        "yes"
    } else {
        "no"
    }
}

/// Parse a URL like `http://192.168.1.100:8080` into (host, port).
fn parse_worker_url(url: &str) -> Result<(String, u16), String> {
    let url = url
        .strip_prefix("http://")
        .or_else(|| url.strip_prefix("https://"))
        .unwrap_or(url);
    let parts: Vec<&str> = url.splitn(2, ':').collect();
    let host = parts[0].to_string();
    let port = parts
        .get(1)
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(80);
    Ok((host, port))
}

fn help() -> Result<(), String> {
    println!("codra <command>");
    println!("  smoke             Validate local tool registry and workspace readiness");
    println!("  provider check    Check active provider health");
    println!("  worker add        Register a remote worker");
    println!("  worker check      Probe a registered worker's health endpoint");
    println!("  worker list       List registered workers");
    println!("  worker remove     Remove a registered worker");
    println!("  headless <intent> Run a dry-run headless planning surface");
    println!("  mcp-server        Print MCP-compatible server/tool metadata");
    Ok(())
}
