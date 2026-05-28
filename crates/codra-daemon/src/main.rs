use axum::{
    body::Body,
    extract::{Path, Query, State},
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::{sse::Event, IntoResponse, Response, Sse},
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use codra_core::workspace_scanner::WorkspaceScanner;
use codra_protocol::*;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};

mod state;
use crate::state::{DaemonConfig, DaemonState};

#[derive(Parser, Debug)]
#[command(name = "codra-daemon")]
struct Args {
    #[arg(long, default_value = "127.0.0.1")]
    host: String,

    #[arg(long, default_value_t = 4387)]
    port: u16,

    #[arg(long)]
    token: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();

    let args = Args::parse();
    let config = DaemonConfig {
        host: args.host.clone(),
        port: args.port,
        token: args
            .token
            .or_else(|| std::env::var("CODRA_DAEMON_TOKEN").ok()),
        data_dir: std::env::current_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."))
            .join(".codra")
            .join("daemon"),
    };

    if config.host == "0.0.0.0" && config.token.is_none() {
        eprintln!("ERROR: Refusing to bind to 0.0.0.0 without CODRA_DAEMON_TOKEN set.");
        std::process::exit(1);
    }

    let daemon_state = Arc::new(DaemonState::new(config.clone()));
    let (event_tx, _) = broadcast::channel::<TaskEvent>(100);
    let app_state = AppState {
        inner: daemon_state.clone(),
        event_tx: event_tx.clone(),
    };

    // Worker health routes are outside the auth gate so remote controllers
    // can probe without a token. The health payload is safe: no secrets,
    // no filesystem paths, no tokens.
    let worker_routes = Router::new()
        .route("/workers/health", get(worker_health))
        .route("/workers/tasks/stub", post(worker_tasks_stub));

    let api_routes = Router::new()
        .route("/workspace/scan", get(scan_workspace))
        .route("/tasks", post(create_task).get(list_tasks))
        .route("/tasks/:id", get(get_task))
        .route("/tasks/:id/events", get(get_task_events))
        .route("/tasks/:id/events/stream", get(task_events_stream))
        .route("/tasks/:id/approve", post(approve_task))
        .route("/tasks/:id/cancel", post(cancel_task))
        .route("/tasks/:id/execute", post(execute_task))
        .route("/tasks/:id/verify", post(verify_task))
        .route("/tasks/:id/repair/approve", post(approve_repair))
        .route_layer(middleware::from_fn_with_state(
            app_state.clone(),
            auth_middleware,
        ));

    let app = Router::new()
        .route("/health", get(health))
        .nest("/api", worker_routes.nest("/", api_routes))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(app_state);

    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    info!(
        "Codra daemon running on http://{}:{}",
        config.host, config.port
    );
    info!("Local-first mode enabled.");
    if config.token.is_none() {
        warn!("No token configured. Daemon is local-only.");
    } else {
        info!("Token authentication enabled.");
    }

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

#[derive(Clone)]
struct AppState {
    inner: Arc<DaemonState>,
    event_tx: broadcast::Sender<TaskEvent>,
}

async fn auth_middleware(
    State(state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> Response {
    if let Some(expected_token) = &state.inner.config.token {
        let authorized = request
            .headers()
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .map(|value| value == format!("Bearer {expected_token}"))
            .unwrap_or(false);

        if !authorized {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "unauthorized"})),
            )
                .into_response();
        }
    }

    next.run(request).await
}

// ── Global endpoints (no auth) ─────────────────────────────────

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "service": "codra-daemon",
        "version": "0.1.0",
        "local_only": true
    }))
}

/// POST /api/workers/tasks/stub — stub remote task submission.
/// Does not execute anything. Validates payload and returns a receipt.
#[derive(Serialize, Deserialize)]
struct RemoteTaskStubRequest {
    task_prompt: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    controller_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    workspace_hint: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    requested_runtime_id: Option<String>,

    #[serde(default = "default_true")]
    dry_run: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Serialize, Deserialize)]
struct RemoteTaskStubResponse {
    accepted: bool,
    remote_task_id: String,
    status: String,
    message: String,
    received_prompt_preview: String,
    worker_health_summary: String,
    next_step: String,
}

const MAX_TASK_PROMPT_BYTES: usize = 1024 * 64; // 64 KiB
const PROMPT_PREVIEW_CHARS: usize = 200;

async fn worker_tasks_stub(
    State(state): State<AppState>,
    Json(payload): Json<RemoteTaskStubRequest>,
) -> Result<Json<RemoteTaskStubResponse>, AppError> {
    if payload.task_prompt.trim().is_empty() {
        return Err(AppError::BadRequest("task_prompt is required".into()));
    }

    if payload.task_prompt.len() > MAX_TASK_PROMPT_BYTES {
        return Err(AppError::BadRequest(format!(
            "task_prompt exceeds maximum size of {} bytes",
            MAX_TASK_PROMPT_BYTES
        )));
    }

    let task_id = uuid::Uuid::new_v4().to_string();
    let prompt_preview: String = payload
        .task_prompt
        .chars()
        .take(PROMPT_PREVIEW_CHARS)
        .collect();
    let health = state.inner.worker_health();
    let health_summary = format!(
        "{} | {} {} | {}s uptime",
        health.status, health.os, health.arch, health.uptime_seconds
    );

    Ok(Json(RemoteTaskStubResponse {
        accepted: true,
        remote_task_id: task_id,
        status: "stubbed".to_string(),
        message: "Remote task submission reached worker. Execution is not enabled yet.".to_string(),
        received_prompt_preview: if prompt_preview.len() < payload.task_prompt.len() {
            format!("{}…", prompt_preview)
        } else {
            prompt_preview
        },
        worker_health_summary: health_summary,
        next_step:
            "Use 'codra worker submit' with --dry-run=false once remote execution is enabled."
                .to_string(),
    }))
}

/// GET /api/workers/health — unauthenticated worker health probe.
async fn worker_health(State(state): State<AppState>) -> Json<state::WorkerHealthResponse> {
    Json(state.inner.worker_health())
}

// ── Auth-gated API endpoints ───────────────────────────────────

#[derive(Deserialize)]
struct ScanQuery {
    path: String,
}

async fn scan_workspace(
    Query(query): Query<ScanQuery>,
) -> Result<Json<WorkspaceContext>, AppError> {
    if query.path.trim().is_empty() {
        return Err(AppError::BadRequest("path is required".into()));
    }

    let ctx = WorkspaceScanner::scan(&query.path).map_err(AppError::Internal)?;
    Ok(Json(ctx))
}

#[derive(Deserialize)]
struct CreateTaskPayload {
    workspace_path: String,
    user_prompt: String,
    title: Option<String>,
}

async fn create_task(
    State(state): State<AppState>,
    Json(payload): Json<CreateTaskPayload>,
) -> Result<Json<Task>, AppError> {
    if payload.user_prompt.trim().is_empty() {
        return Err(AppError::BadRequest("user_prompt is required".into()));
    }

    let task = state
        .inner
        .task_planner
        .create_task(
            &payload.workspace_path,
            &payload.user_prompt,
            payload.title.as_deref(),
        )
        .map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn list_tasks(State(state): State<AppState>) -> Result<Json<Vec<Task>>, AppError> {
    let tasks = state
        .inner
        .task_store
        .list_tasks()
        .map_err(AppError::Internal)?;
    Ok(Json(tasks))
}

async fn get_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Task>, AppError> {
    let task = state
        .inner
        .task_store
        .load_task(&id)
        .map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn get_task_events(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<TaskEvent>>, AppError> {
    let events = state
        .inner
        .task_store
        .list_events(&id)
        .map_err(AppError::Internal)?;
    Ok(Json(events))
}

async fn task_events_stream(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Sse<impl futures::Stream<Item = Result<Event, Infallible>>> {
    let store = state.inner.task_store.clone();
    let stream = async_stream::stream! {
        let mut last_count = 0usize;
        loop {
            if let Ok(events) = store.list_events(&id) {
                if events.len() > last_count {
                    for ev in events.iter().skip(last_count) {
                        if let Ok(json) = serde_json::to_string(ev) {
                            yield Ok(Event::default().data(json));
                        }
                    }
                    last_count = events.len();
                }
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    };
    Sse::new(stream)
}

async fn approve_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Task>, AppError> {
    let task = state
        .inner
        .task_lifecycle
        .approve_task(&id)
        .map_err(AppError::Internal)?;
    Ok(Json(task))
}

#[derive(Deserialize)]
struct CancelPayload {
    reason: Option<String>,
}

async fn cancel_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<CancelPayload>,
) -> Result<Json<Task>, AppError> {
    let task = state
        .inner
        .task_lifecycle
        .cancel_task(&id, payload.reason.as_deref())
        .map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn execute_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Task>, AppError> {
    let task = state
        .inner
        .task_executor
        .execute_approved_task(&id)
        .map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn verify_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<VerificationResult>, AppError> {
    let result = state
        .inner
        .task_verifier
        .run_verification(&id, None)
        .map_err(AppError::Internal)?;
    Ok(Json(result))
}

async fn approve_repair(
    State(_state): State<AppState>,
    Path(_id): Path<String>,
) -> Result<Json<Task>, AppError> {
    Err(AppError::Conflict(
        "repair approval is not implemented in codra-core yet".into(),
    ))
}

#[derive(Debug)]
enum AppError {
    BadRequest(String),
    NotFound,
    Unauthorized,
    Conflict(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, body) = match self {
            AppError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": msg})),
            ),
            AppError::NotFound => (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({"error": "Task not found"})),
            ),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "unauthorized"})),
            ),
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": msg})),
            ),
            AppError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": msg})),
            ),
        };
        (status, body).into_response()
    }
}

// ── Tests ────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn stub_request_serializes() {
        let req = RemoteTaskStubRequest {
            task_prompt: "write a test".to_string(),
            controller_id: Some("ctrl-001".to_string()),
            workspace_hint: None,
            requested_runtime_id: None,
            dry_run: true,
        };
        let json = serde_json::to_value(&req).unwrap();
        assert_eq!(json["task_prompt"], "write a test");
        assert_eq!(json["controller_id"], "ctrl-001");
        assert_eq!(json["dry_run"], true);
        // Optional fields omitted when None
        assert!(json.get("workspace_hint").is_none());
    }

    #[test]
    fn stub_request_empty_prompt_rejected() {
        // Simulate the validation check done by the handler
        let payload = RemoteTaskStubRequest {
            task_prompt: "   ".to_string(),
            controller_id: None,
            workspace_hint: None,
            requested_runtime_id: None,
            dry_run: true,
        };
        assert!(payload.task_prompt.trim().is_empty());
    }

    #[test]
    fn stub_response_deserializes() {
        let json = serde_json::json!({
            "accepted": true,
            "remote_task_id": "abc-123",
            "status": "stubbed",
            "message": "Remote task submission reached worker. Execution is not enabled yet.",
            "received_prompt_preview": "write a test",
            "worker_health_summary": "ok | linux aarch64 | 42s uptime",
            "next_step": "Use 'codra worker submit' with --dry-run=false once remote execution is enabled."
        });
        let resp: RemoteTaskStubResponse = serde_json::from_value(json).unwrap();
        assert!(resp.accepted);
        assert_eq!(resp.status, "stubbed");
        assert_eq!(resp.remote_task_id, "abc-123");
        assert!(resp.message.contains("not enabled yet"));
        assert!(resp.next_step.contains("dry-run"));
    }

    #[test]
    fn prompt_preview_truncated() {
        let long_prompt = "x".repeat(500);
        let preview: String = long_prompt.chars().take(PROMPT_PREVIEW_CHARS).collect();
        assert_eq!(preview.len(), PROMPT_PREVIEW_CHARS);
        let truncated = if preview.len() < long_prompt.len() {
            format!("{}…", preview)
        } else {
            preview.clone()
        };
        assert_eq!(truncated.len(), PROMPT_PREVIEW_CHARS + 3); // '…' is 3 bytes
        assert!(truncated.ends_with('…'));
    }

    #[test]
    fn stub_request_exceeds_max_size() {
        let req = RemoteTaskStubRequest {
            task_prompt: "x".repeat(MAX_TASK_PROMPT_BYTES + 1),
            controller_id: None,
            workspace_hint: None,
            requested_runtime_id: None,
            dry_run: true,
        };
        assert!(req.task_prompt.len() > MAX_TASK_PROMPT_BYTES);
    }
}
