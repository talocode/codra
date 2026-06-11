use crate::types::{MemoryBudget, MemorySection};

pub fn truncate_to_budget(content: &str, max_chars: usize) -> (String, bool) {
    if content.chars().count() <= max_chars {
        return (content.to_string(), false);
    }

    let truncated: String = content.chars().take(max_chars).collect();
    let mut out = truncated;
    out.push_str("\n… [truncated]");
    (out, true)
}

pub fn apply_section_budget(
    name: impl Into<String>,
    source_path: Option<std::path::PathBuf>,
    content: Option<String>,
    max_chars: usize,
) -> (MemorySection, bool) {
    let present = content.is_some();
    let raw = content.unwrap_or_default();
    let (trimmed, truncated) = truncate_to_budget(&raw, max_chars);
    let chars_used = trimmed.chars().count();

    (
        MemorySection {
            name: name.into(),
            source_path,
            content: trimmed,
            chars_used,
            present,
        },
        truncated,
    )
}

pub fn remaining_budget(budget: &MemoryBudget, used: usize) -> usize {
    budget.total.saturating_sub(used)
}

pub fn section_cap(budget: &MemoryBudget, section_max: usize, total_used: usize) -> usize {
    let remaining = remaining_budget(budget, total_used);
    section_max.min(remaining)
}