use codra_protocol::FileChange;
use std::fs;
use std::path::{Path, PathBuf};

pub fn validate_file_change(workspace_path: &Path, change: &FileChange) -> Result<(), String> {
    let full_path = workspace_path.join(&change.path);

    // Block absolute paths and path traversal
    if change.change_type.starts_with('/') || change.change_type.contains("..") {
        return Err("Path traversal or absolute path outside workspace is not allowed".to_string());
    }

    // Ensure the final path is still inside the workspace
    if !full_path.starts_with(workspace_path) {
        return Err("Resolved path escapes workspace".to_string());
    }

    Ok(())
}

pub fn create_backup(
    workspace_path: &Path,
    relative_path: &str,
    backup_dir: &Path,
) -> Result<PathBuf, String> {
    let source = workspace_path.join(relative_path);
    if !source.exists() {
        return Ok(PathBuf::new()); // nothing to backup
    }

    let backup_path = backup_dir.join(format!("{}.bak", relative_path.replace('/', "_")));
    fs::create_dir_all(backup_dir).map_err(|e| e.to_string())?;
    fs::copy(&source, &backup_path).map_err(|e| e.to_string())?;
    Ok(backup_path)
}

pub fn apply_file_change(
    workspace_path: &Path,
    change: &mut FileChange,
    backup_dir: &Path,
    content: Option<&str>,
) -> Result<(), String> {
    validate_file_change(workspace_path, change)?;

    let full_path = workspace_path.join(&change.path);
    fs::create_dir_all(full_path.parent().unwrap()).map_err(|e| e.to_string())?;

    // Create backup before modifying
    let _ = create_backup(workspace_path, &change.path, backup_dir);

    match change.change_type.as_str() {
        "create" | "modify" => {
            let file_content = content.unwrap_or("");
            fs::write(&full_path, file_content).map_err(|e| e.to_string())?;
            change.applied = true;
        }
        "delete" => {
            if full_path.exists() {
                fs::remove_file(&full_path).map_err(|e| e.to_string())?;
                change.applied = true;
            }
        }
        _ => return Err("Unsupported change type".to_string()),
    }

    Ok(())
}

pub fn apply_search_replace(
    workspace_path: &Path,
    path: &str,
    search: &str,
    replace: &str,
    backup_dir: &Path,
) -> Result<String, String> {
    let full_path = workspace_path.join(path);
    if !full_path.starts_with(workspace_path) {
        return Err("Path traversal not allowed".to_string());
    }

    if !full_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let content = fs::read_to_string(&full_path).map_err(|e| e.to_string())?;

    let _ = create_backup(workspace_path, path, backup_dir);

    let new_content = content.replace(search, replace);

    if content == new_content {
        return Ok(format!("No matches found for '{}' in {}", search, path));
    }

    let matches = content.matches(search).count();
    fs::write(&full_path, &new_content).map_err(|e| e.to_string())?;

    Ok(format!("Replaced {} occurrence(s) in {}", matches, path))
}
