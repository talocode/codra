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
use serde::Deserialize;
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
        .nest("/api", api_routes)
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
