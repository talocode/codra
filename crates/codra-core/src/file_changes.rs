use codra_protocol::FileChange;
use std::fs;
use std::path::{Path, PathBuf};

pub fn validate_file_change(workspace_path: &Path, change: &FileChange) -> Result<(), String> {
    let full_path = workspace_path.join(&change.path);

    // Block absolute paths and path traversal
    if change.path.starts_with('/') || change.path.contains("..") {
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
) -> Result<(), String> {
    validate_file_change(workspace_path, change)?;

    let full_path = workspace_path.join(&change.path);
    fs::create_dir_all(full_path.parent().unwrap()).map_err(|e| e.to_string())?;

    // Create backup before modifying
    let _ = create_backup(workspace_path, &change.path, backup_dir);

    match change.change_type.as_str() {
        "create" | "modify" => {
            fs::write(&full_path, "").map_err(|e| e.to_string())?; // placeholder - real patch later
            change.applied = true;
        }
        "delete" => {
            // Block delete by default for safety in MVP
            return Err("Delete operations are blocked by default in MVP".to_string());
        }
        _ => return Err("Unsupported change type".to_string()),
    }

    Ok(())
}
