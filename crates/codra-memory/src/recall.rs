use std::collections::HashMap;
use std::fs;
use std::path::Path;

use crate::secrets::filter_secret_lines;
use crate::types::{MemorySearchResult, MemorySource};

pub fn recall_in_paths(
    query: &str,
    paths: &[std::path::PathBuf],
    limit: usize,
    threshold: f32,
) -> Vec<MemorySearchResult> {
    let query_terms: Vec<String> = query
        .split_whitespace()
        .map(|t| t.to_lowercase())
        .filter(|t| t.len() >= 2)
        .collect();

    if query_terms.is_empty() {
        return Vec::new();
    }

    let mut results = Vec::new();

    for path in paths {
        if !path.is_file() {
            continue;
        }

        let raw = match fs::read_to_string(path) {
            Ok(content) => filter_secret_lines(&content),
            Err(_) => continue,
        };

        if raw.trim().is_empty() {
            continue;
        }

        let lower = raw.to_lowercase();
        let mut match_count = 0usize;
        for term in &query_terms {
            if lower.contains(term) {
                match_count += 1;
            }
        }

        if match_count == 0 {
            continue;
        }

        let score = match_count as f32 / query_terms.len() as f32;
        if score < threshold {
            continue;
        }

        let snippet = extract_snippet(&raw, &query_terms, 320);
        let id = format!("recall:{}", path.display());

        results.push(MemorySearchResult {
            id,
            content: snippet,
            score,
            source: MemorySource::LocalMarkdown,
            source_path: path.clone(),
            metadata: HashMap::new(),
        });
    }

    results.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(limit);
    results
}

fn extract_snippet(content: &str, terms: &[String], max_chars: usize) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let mut best_idx = 0usize;
    let mut best_score = 0usize;

    for (idx, line) in lines.iter().enumerate() {
        let lower = line.to_lowercase();
        let score = terms.iter().filter(|t| lower.contains(t.as_str())).count();
        if score > best_score {
            best_score = score;
            best_idx = idx;
        }
    }

    let start = best_idx.saturating_sub(1);
    let end = (best_idx + 3).min(lines.len());
    let snippet = lines[start..end].join("\n");
    if snippet.chars().count() <= max_chars {
        snippet
    } else {
        snippet.chars().take(max_chars).collect::<String>() + "…"
    }
}

pub fn read_file_if_present(path: &Path) -> Option<String> {
    if !path.is_file() {
        return None;
    }
    let content = fs::read_to_string(path).ok()?;
    let filtered = filter_secret_lines(&content);
    if filtered.trim().is_empty() {
        None
    } else {
        Some(filtered)
    }
}