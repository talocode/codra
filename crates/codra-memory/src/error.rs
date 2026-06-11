use thiserror::Error;

#[derive(Debug, Error)]
pub enum MemoryError {
    #[error("memory IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("memory path error: {0}")]
    Path(String),

    #[error("memory not found: {0}")]
    NotFound(String),

    #[error("memory operation unsupported: {0}")]
    Unsupported(String),
}

pub type MemoryResult<T> = Result<T, MemoryError>;