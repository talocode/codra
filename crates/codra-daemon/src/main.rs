use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{sse::Event, IntoResponse, Sse},
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use crate::state::{DaemonConfig, DaemonState};
use codra_protocol::*;
use serde::Deserialize;
use std::net::SocketAddr;
use std::time::Duration;
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};

mod state;

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
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let args = Args::parse();

    let config = DaemonConfig {
        host: args.host.clone(),
        port: args.port,
        token: args.token.or_else(|| std::env::var("CODRA_DAEMON_TOKEN").ok()),
        data_dir: std::env::current_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."))
            .join(".codra")
            .join("daemon"),
    };

    if config.host == "0.0.0.0" && config.token.is_none() {
        eprintln!("ERROR: Refusing to bind to 0.0.0.0 without CODRA_DAEMON_TOKEN set.");
        std::process::exit(1);
    }

    let state = DaemonState::new(config.clone());
    let (event_tx, _) = broadcast::channel::<TaskEvent>(100);

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/workspace/scan", get(scan_workspace))
        .route("/api/tasks", post(create_task).get(list_tasks))
        .route("/api/tasks/:id", get(get_task))
        .route("/api/tasks/:id/events", get(get_task_events))
        .route("/api/tasks/:id/events/stream", get(task_events_stream))
        .route("/api/tasks/:id/approve", post(approve_task))
        .route("/api/tasks/:id/cancel", post(cancel_task))
        .route("/api/tasks/:id/execute", post(execute_task))
        .route("/api/tasks/:id/verify", post(verify_task))
        .route("/api/tasks/:id/repair/approve", post(approve_repair))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(AppState {
            inner: std::sync::Arc::new(state),
            event_tx,
        });

    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    info!("Codra daemon running on http://{}:{}", config.host, config.port);
    info!("Local-first mode enabled.");
    if config.token.is_none() {
        warn!("No token configured. Daemon is local-only.");
    }

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

#[derive(Clone)]
struct AppState {
    inner: std::sync::Arc<DaemonState>,
    event_tx: broadcast::Sender<TaskEvent>,
}

// Handlers

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "service": "codra-daemon",
        "version": "0.1.0",
        "local_only": true
    }))
}

#[derive(Deserialize)]
struct ScanQuery {
    path: String,
}

#[derive(Deserialize)]
struct CreateTaskPayload {
    workspace_path: String,
    user_prompt: String,
    title: Option<String>,
}

async fn scan_workspace(
    State(state): State<AppState>,
    Query(query): Query<ScanQuery>,
) -> Result<Json<WorkspaceContext>, AppError> {
    if query.path.trim().is_empty() {
        return Err(AppError::BadRequest("path is required".into()));
    }
    let ctx = state.inner.workspace_scanner.scan(&query.path).map_err(AppError::Internal)?;
    Ok(Json(ctx))
}

async fn create_task(
    State(state): State<AppState>,
    Json(payload): Json<CreateTaskPayload>,
) -> Result<Json<VerificationResult>, AppError> {
    if payload.user_prompt.trim().is_empty() {
        return Err(AppError::BadRequest("user_prompt is required".into()));
    }
    let task = state.inner.task_planner.create_task(
        &payload.workspace_path,
        &payload.user_prompt,
        payload.title.as_deref(),
    )?;
    Ok(Json(task))
}

async fn list_tasks(State(state): State<AppState>) -> Result<Json<Vec<Task>>, AppError> {
    let tasks = state.inner.task_store.list_tasks().map_err(AppError::Internal)?;
    Ok(Json(tasks))
}

async fn get_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<VerificationResult>, AppError> {
    let task = state
        .inner
        .task_store
        .get_task(&id)
        .map_err(AppError::Internal)?
        .ok_or(AppError::NotFound)?;
    Ok(Json(task))
}

async fn get_task_events(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<TaskEvent>>, AppError> {
    let events = state.inner.task_store.get_events(&id).map_err(AppError::Internal)?;
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
            if let Ok(events) = store.get_events(&id) {
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
) -> Result<Json<VerificationResult>, AppError> {
    let task = state.inner.task_lifecycle.approve_task(&id).map_err(AppError::Internal)?;
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
) -> Result<Json<VerificationResult>, AppError> {
    let task = state
        .inner
        .task_lifecycle
        .cancel_task(&id, payload.reason.as_deref())
        .map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn execute_task(
    State(state): State<AppState>,
    let task = state.inner.task_executor.execute_approved_task(&id).map_err(AppError::Internal)?;
) -> Result<Json<VerificationResult>, AppError> {
    let task = state.inner.task_executor.execute_approved_task(state.inner.task_executor.execute(&id)id).map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn verify_task(
    State(state): State<AppState>,
    let result = state.inner.task_verifier.run_verification(&id, None).map_err(AppError::Internal)?;
    Ok(Json(result))
    let task = state.inner.task_verifier.run_verification(&id).map_err(AppError::Internal)?;
    Ok(Json(task))
}

async fn approve_repair(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<VerificationResult>, AppError> {
    let task = state.inner.task_lifecycle.approve_repair(&id).map_err(AppError::Internal)?;
    Ok(Json(task))
}

#[derive(Debug)]
enum AppError {
    BadRequest(String),
    NotFound,
    Unauthorized,
    Conflict(String),
    Internal(anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
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
                Json(serde_json::json!({"error": "Unauthorized"})),
            ),
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": msg})),
            ),
            AppError::Internal(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            ),
        };
        (status, body).into_response()
    }
}