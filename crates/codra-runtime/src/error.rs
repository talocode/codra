use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum RuntimeError {
    #[error("Runtime not found: {0}")]
    NotFound(String),

    #[error("Runtime already registered: {0}")]
    AlreadyRegistered(String),

    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("Task not found: {0}")]
    TaskNotFound(String),

    #[error("Runtime not initialized")]
    NotInitialized,

    #[error("Runtime already initialized")]
    AlreadyInitialized,

    #[error("Operation not supported")]
    Unsupported,

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Runtime error: {0}")]
    Runtime(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Handoff failed: {0}")]
    HandoffFailed(String),
}

pub type RuntimeResult<T> = Result<T, RuntimeError>;
