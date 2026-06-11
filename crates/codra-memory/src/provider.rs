use crate::error::MemoryResult;
use crate::types::{
    MemoryAddInput, MemoryContextBundle, MemoryContextQuery, MemoryRecord, MemoryScope,
    MemorySearchResult, MemoryStatusReport, UserProjectProfile,
};

pub const LOCAL_MARKDOWN_PROVIDER: &str = "local-markdown";

pub trait MemoryProvider {
    fn provider_name(&self) -> &'static str;

    fn add(&self, input: MemoryAddInput) -> MemoryResult<MemoryRecord>;

    fn recall(&self, query: &str, scope: &MemoryScope) -> MemoryResult<Vec<MemorySearchResult>>;

    fn profile(&self, scope: &MemoryScope) -> MemoryResult<UserProjectProfile>;

    fn forget(&self, id: &str) -> MemoryResult<()>;

    fn context(&self, query: MemoryContextQuery) -> MemoryResult<MemoryContextBundle>;

    fn status(&self, scope: &MemoryScope) -> MemoryResult<MemoryStatusReport>;
}