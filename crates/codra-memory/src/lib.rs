pub mod budget;
pub mod error;
pub mod local;
pub mod paths;
pub mod provider;
pub mod recall;
pub mod secrets;
pub mod types;

pub use error::{MemoryError, MemoryResult};
pub use local::LocalMarkdownMemoryProvider;
pub use provider::{MemoryProvider, LOCAL_MARKDOWN_PROVIDER};
pub use types::{
    MemoryAddInput, MemoryBudget, MemoryContextBundle, MemoryContextQuery, MemoryFileStatus,
    MemoryRecord, MemoryScope, MemorySearchResult, MemorySection, MemorySource,
    MemoryStatusReport, UserProjectProfile,
};

/// Legacy trait kept for runtime adapter compatibility. New code should use [`MemoryProvider`].
pub trait MemoryStore {
    fn init(&self) -> Result<(), String>;
    fn store_context(&self, key: &str, value: &str) -> Result<(), String>;
    fn get_context(&self, key: &str) -> Result<Option<String>, String>;
}