use codra_core::command_safety::is_command_allowed;
use codra_core::file_changes::{apply_file_change, validate_file_change};
use codra_core::workspace_scanner::WorkspaceScanner;
use codra_protocol::FileChange;
use std::env;
use std::fs;

#[test]
fn test_command_safety_allows_safe_commands() {
    assert!(is_command_allowed("pnpm build", None).allowed);
    assert!(is_command_allowed("cargo test", None).allowed);
}

#[test]
fn test_command_safety_rejects_dangerous_commands() {
    assert!(!is_command_allowed("rm -rf /", None).allowed);
    assert!(!is_command_allowed("npm publish", None).allowed);
}

#[test]
fn test_workspace_scanner_invalid_path() {
    let result = WorkspaceScanner::scan("/nonexistent/path/123456");
    assert!(result.is_err());
}

#[test]
fn test_file_change_path_traversal_blocked() {
    let dir = env::temp_dir();
    let change = FileChange {
        path: "../outside.txt".to_string(),
        change_type: "create".to_string(),
        approved: true,
        applied: false,
    };
    assert!(validate_file_change(&dir, &change).is_err());
}

#[test]
fn test_apply_file_change_creates_file() {
    let dir = env::temp_dir().join("codra_test_apply");
    let _ = fs::create_dir_all(&dir);
    let backup_dir = dir.join(".backups");
    let mut change = FileChange {
        path: "new_file.txt".to_string(),
        change_type: "create".to_string(),
        approved: true,
        applied: false,
    };
    apply_file_change(&dir, &mut change, &backup_dir).unwrap();
    assert!(change.applied);
    let _ = fs::remove_dir_all(&dir);
}
