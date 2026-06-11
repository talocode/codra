use std::fs;
use std::path::PathBuf;

use chrono::Utc;

use crate::budget::{apply_section_budget, section_cap};
use crate::error::MemoryResult;
use crate::paths::{
    global_memory_paths, global_status_files, global_user_paths, project_status_files,
    recall_search_paths, task_decisions_file, task_plan_file, task_progress_file,
    workspace_checkpoint_file, workspace_memory_file, workspace_notes_file,
};
use crate::provider::{MemoryProvider, LOCAL_MARKDOWN_PROVIDER};
use crate::recall::{read_file_if_present, recall_in_paths};
use crate::types::{
    MemoryAddInput, MemoryContextBundle, MemoryContextQuery, MemoryFileStatus, MemoryRecord,
    MemoryScope, MemorySearchResult, MemorySection, MemorySource, MemoryStatusReport,
    UserProjectProfile,
};

#[derive(Debug, Clone, Default)]
pub struct LocalMarkdownMemoryProvider;

impl LocalMarkdownMemoryProvider {
    pub fn new() -> Self {
        Self
    }

    fn first_existing(paths: &[PathBuf]) -> Option<(PathBuf, String)> {
        for path in paths {
            if let Some(content) = read_file_if_present(path) {
                return Some((path.clone(), content));
            }
        }
        None
    }

    fn extract_profile_facts(content: &str, max_facts: usize) -> Vec<String> {
        content
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty() && !line.starts_with('#'))
            .map(|line| line.trim_start_matches("- ").trim_start_matches("* ").to_string())
            .filter(|line| !line.is_empty())
            .take(max_facts)
            .collect()
    }

    fn extract_dynamic_facts(content: &str, max_facts: usize) -> Vec<String> {
        let lines: Vec<String> = content
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .map(str::to_string)
            .collect();

        let tail = if lines.len() > max_facts {
            &lines[lines.len() - max_facts..]
        } else {
            &lines[..]
        };

        tail.to_vec()
    }
}

impl MemoryProvider for LocalMarkdownMemoryProvider {
    fn provider_name(&self) -> &'static str {
        LOCAL_MARKDOWN_PROVIDER
    }

    fn add(&self, input: MemoryAddInput) -> MemoryResult<MemoryRecord> {
        let notes_path = workspace_notes_file(&input.scope.project_path);
        if let Some(parent) = notes_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let timestamp = Utc::now().to_rfc3339();
        let entry = format!("\n\n## Memory entry ({timestamp})\n{}\n", input.content.trim());
        if notes_path.exists() {
            fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&notes_path)?
                .write_all(entry.as_bytes())?;
        } else {
            fs::write(&notes_path, format!("# Notes\n{entry}"))?;
        }

        let id = input
            .custom_id
            .clone()
            .unwrap_or_else(|| format!("notes:{timestamp}"));

        Ok(MemoryRecord {
            id,
            content: input.content,
            scope: input.scope,
            metadata: input.metadata,
            created_at: timestamp,
            source: MemorySource::LocalMarkdown,
            source_path: Some(notes_path),
        })
    }

    fn recall(&self, query: &str, scope: &MemoryScope) -> MemoryResult<Vec<MemorySearchResult>> {
        let paths = recall_search_paths(scope);
        Ok(recall_in_paths(query, &paths, 10, 0.3))
    }

    fn profile(&self, scope: &MemoryScope) -> MemoryResult<UserProjectProfile> {
        let mut static_facts = Vec::new();

        if let Some((_, content)) = Self::first_existing(&global_user_paths()) {
            static_facts.extend(Self::extract_profile_facts(&content, 12));
        }

        if let Some((_, content)) = Self::first_existing(&global_memory_paths()) {
            static_facts.extend(Self::extract_profile_facts(&content, 8));
        }

        if let Some(content) = read_file_if_present(&workspace_memory_file(&scope.project_path)) {
            static_facts.extend(Self::extract_profile_facts(&content, 8));
        }

        let mut dynamic_facts = Vec::new();

        if let Some(content) = read_file_if_present(&workspace_checkpoint_file(&scope.project_path))
        {
            dynamic_facts.extend(Self::extract_dynamic_facts(&content, 6));
        }

        if let Some(content) = read_file_if_present(&workspace_notes_file(&scope.project_path)) {
            dynamic_facts.extend(Self::extract_dynamic_facts(&content, 4));
        }

        if let Some(task_id) = &scope.task_id {
            if let Some(content) =
                read_file_if_present(&task_progress_file(&scope.project_path, task_id))
            {
                dynamic_facts.extend(Self::extract_dynamic_facts(&content, 6));
            }
        }

        Ok(UserProjectProfile {
            static_facts,
            dynamic_facts,
        })
    }

    fn forget(&self, id: &str) -> MemoryResult<()> {
        let forgotten_dir = crate::paths::global_codra_dir().join("memory/.forgotten");
        fs::create_dir_all(&forgotten_dir)?;
        let tombstone = forgotten_dir.join(format!("{}.txt", sanitize_id(id)));
        fs::write(
            &tombstone,
            format!("forgotten_at={}\n", Utc::now().to_rfc3339()),
        )?;
        Ok(())
    }

    fn context(&self, query: MemoryContextQuery) -> MemoryResult<MemoryContextBundle> {
        let budget = query.budget.clone();
        let mut sections = Vec::new();
        let mut total_chars = 0usize;
        let mut truncated = false;

        let profile = if query.include_profile {
            self.profile(&query.scope)?
        } else {
            UserProjectProfile::default()
        };

        let mut push_section = |name: &str, path: Option<PathBuf>, content: Option<String>, cap: usize| {
            let effective_cap = section_cap(&budget, cap, total_chars);
            if effective_cap == 0 {
                sections.push(MemorySection {
                    name: name.to_string(),
                    source_path: path,
                    content: String::new(),
                    chars_used: 0,
                    present: content.is_some(),
                });
                return;
            }

            let (section, section_truncated) =
                apply_section_budget(name, path, content, effective_cap);
            total_chars += section.chars_used;
            truncated |= section_truncated;
            sections.push(section);
        };

        let (user_path, user_content) = Self::first_existing(&global_user_paths())
            .map(|(p, c)| (Some(p), Some(c)))
            .unwrap_or((None, None));
        push_section("user_profile", user_path, user_content, budget.user_md);

        let (global_mem_path, global_mem_content) = Self::first_existing(&global_memory_paths())
            .map(|(p, c)| (Some(p), Some(c)))
            .unwrap_or((None, None));
        push_section(
            "global_memory",
            global_mem_path,
            global_mem_content,
            budget.global_memory_md,
        );

        push_section(
            "project_memory",
            Some(workspace_memory_file(&query.scope.project_path)),
            read_file_if_present(&workspace_memory_file(&query.scope.project_path)),
            budget.project_memory_md,
        );

        push_section(
            "checkpoint",
            Some(workspace_checkpoint_file(&query.scope.project_path)),
            read_file_if_present(&workspace_checkpoint_file(&query.scope.project_path)),
            budget.checkpoint_md,
        );

        push_section(
            "notes",
            Some(workspace_notes_file(&query.scope.project_path)),
            read_file_if_present(&workspace_notes_file(&query.scope.project_path)),
            budget.notes_md,
        );

        if let Some(task_id) = &query.scope.task_id {
            push_section(
                "task_progress",
                Some(task_progress_file(&query.scope.project_path, task_id)),
                read_file_if_present(&task_progress_file(&query.scope.project_path, task_id)),
                budget.progress_md,
            );
            push_section(
                "task_plan",
                Some(task_plan_file(&query.scope.project_path, task_id)),
                read_file_if_present(&task_plan_file(&query.scope.project_path, task_id)),
                budget.progress_md / 2,
            );
            push_section(
                "task_decisions",
                Some(task_decisions_file(&query.scope.project_path, task_id)),
                read_file_if_present(&task_decisions_file(&query.scope.project_path, task_id)),
                budget.progress_md / 2,
            );
        }

        let recall_results = if let Some(ref q) = query.query {
            if !q.trim().is_empty() {
                let mut results = self.recall(q, &query.scope)?;
                results.truncate(query.limit);

                let recall_cap = section_cap(&budget, budget.search_results, total_chars);
                if recall_cap > 0 {
                    let joined = results
                        .iter()
                        .map(|r| {
                            format!(
                                "[{} score={:.2}]\n{}",
                                r.source_path.display(),
                                r.score,
                                r.content
                            )
                        })
                        .collect::<Vec<_>>()
                        .join("\n\n");

                    let (section, section_truncated) = apply_section_budget(
                        "recall_results",
                        None,
                        if joined.is_empty() { None } else { Some(joined) },
                        recall_cap,
                    );
                    total_chars += section.chars_used;
                    truncated |= section_truncated;
                    sections.push(section);
                }

                results
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        };

        Ok(MemoryContextBundle {
            provider: LOCAL_MARKDOWN_PROVIDER.to_string(),
            scope: query.scope,
            profile,
            sections,
            recall_results,
            budget,
            total_chars,
            truncated,
        })
    }

    fn status(&self, scope: &MemoryScope) -> MemoryResult<MemoryStatusReport> {
        let global_files = global_status_files()
            .into_iter()
            .map(|(_label, path)| MemoryFileStatus {
                path: path.clone(),
                present: path.is_file(),
            })
            .collect();

        let project_files = project_status_files(scope)
            .into_iter()
            .map(|(_, path)| MemoryFileStatus {
                path: path.clone(),
                present: path.is_file(),
            })
            .collect();

        let task_files = if let Some(task_id) = &scope.task_id {
            vec![
                task_progress_file(&scope.project_path, task_id),
                task_plan_file(&scope.project_path, task_id),
                task_decisions_file(&scope.project_path, task_id),
            ]
            .into_iter()
            .map(|path| MemoryFileStatus {
                path: path.clone(),
                present: path.is_file(),
            })
            .collect()
        } else {
            Vec::new()
        };

        Ok(MemoryStatusReport {
            provider: LOCAL_MARKDOWN_PROVIDER.to_string(),
            scope: scope.clone(),
            global_files,
            project_files,
            task_files,
        })
    }
}

fn sanitize_id(id: &str) -> String {
    id.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

use std::io::Write;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::MemoryBudget;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_workspace() -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("codra-memory-test-{nanos}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn reads_workspace_memory() {
        let root = temp_workspace();
        let codra = root.join(".codra");
        fs::create_dir_all(&codra).unwrap();
        fs::write(codra.join("MEMORY.md"), "- Project uses Rust\n").unwrap();

        let provider = LocalMarkdownMemoryProvider::new();
        let scope = MemoryScope::new(root.clone());
        let profile = provider.profile(&scope).unwrap();

        assert!(profile
            .static_facts
            .iter()
            .any(|f| f.contains("Project uses Rust")));
    }

    #[test]
    fn task_scope_loads_task_files() {
        let root = temp_workspace();
        let task_id = "task-abc";
        let task_path = root.join(".codra/tasks").join(task_id);
        fs::create_dir_all(&task_path).unwrap();
        fs::write(task_path.join("progress.md"), "Debugging deploy async\n").unwrap();

        let provider = LocalMarkdownMemoryProvider::new();
        let scope = MemoryScope::new(root.clone()).with_task(task_id);

        let bundle = provider
            .context(MemoryContextQuery {
                scope: scope.clone(),
                include_profile: true,
                ..Default::default()
            })
            .unwrap();

        let task_section = bundle
            .sections
            .iter()
            .find(|s| s.name == "task_progress")
            .expect("task_progress section");
        assert!(task_section.present);
        assert!(task_section.content.contains("Debugging deploy async"));
    }

    #[test]
    fn budget_prevents_blind_injection() {
        let root = temp_workspace();
        let codra = root.join(".codra");
        fs::create_dir_all(&codra).unwrap();
        let huge = "x".repeat(20_000);
        fs::write(codra.join("MEMORY.md"), &huge).unwrap();

        let provider = LocalMarkdownMemoryProvider::new();
        let scope = MemoryScope::new(root);
        let bundle = provider
            .context(MemoryContextQuery {
                scope,
                budget: MemoryBudget {
                    total: 500,
                    project_memory_md: 200,
                    ..Default::default()
                },
                ..Default::default()
            })
            .unwrap();

        assert!(bundle.total_chars <= 500);
        assert!(bundle.truncated);
    }

    #[test]
    fn recall_returns_source_paths() {
        let root = temp_workspace();
        let codra = root.join(".codra");
        fs::create_dir_all(&codra).unwrap();
        fs::write(
            codra.join("MEMORY.md"),
            "Codra deploy architecture uses Docker runner\n",
        )
        .unwrap();

        let provider = LocalMarkdownMemoryProvider::new();
        let scope = MemoryScope::new(root.clone());
        let results = provider.recall("deploy architecture", &scope).unwrap();

        assert!(!results.is_empty());
        assert!(results[0].source_path.ends_with("MEMORY.md"));
    }

    #[test]
    fn missing_files_do_not_crash() {
        let root = temp_workspace();
        let provider = LocalMarkdownMemoryProvider::new();
        let scope = MemoryScope::new(root);

        let bundle = provider
            .context(MemoryContextQuery {
                scope,
                ..Default::default()
            })
            .unwrap();

        assert_eq!(bundle.provider, LOCAL_MARKDOWN_PROVIDER);
    }
}