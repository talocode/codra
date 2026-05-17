use codra_protocol::{DetectedCommand, FileNodeKind, WorkspaceContext, WorkspaceFileNode};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_FILE_SIZE_FOR_TREE: u64 = 2 * 1024 * 1024; // 2MB
const MAX_FILE_SIZE_FOR_CONTENT: u64 = 256 * 1024; // 256KB

const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    ".git",
    ".next",
    "coverage",
    "vendor",
    ".turbo",
    ".cache",
    "out",
    ".codra",
];

pub struct WorkspaceScanner;

impl WorkspaceScanner {
    pub fn scan(workspace_path: impl AsRef<Path>) -> Result<WorkspaceContext, String> {
        let root = workspace_path.as_ref().to_path_buf();
        if !root.exists() {
            return Err("Workspace path does not exist".to_string());
        }
        if !root.is_dir() {
            return Err("Workspace path is not a directory".to_string());
        }

        let canonical_root = root.canonicalize().map_err(|e| e.to_string())?;
        let scanned_at = Self::current_timestamp();

        let is_git_repo = canonical_root.join(".git").exists();
        let git_branch = if is_git_repo {
            Self::detect_git_branch(&canonical_root)
        } else {
            None
        };
        let git_status_summary = if is_git_repo {
            Self::get_git_status_summary(&canonical_root)
        } else {
            None
        };

        let detected_config_files = Self::detect_config_files(&canonical_root);
        let detected_package_managers = Self::detect_package_managers(&detected_config_files);
        let detected_stack = Self::detect_stack(&detected_config_files, &detected_package_managers);
        let suggested_commands =
            Self::suggest_commands(&detected_config_files, &detected_package_managers);

        let file_tree = Self::build_file_tree(&canonical_root, 0, 3)?;

        Ok(WorkspaceContext {
            workspace_path: canonical_root.to_string_lossy().to_string(),
            is_git_repo,
            git_branch,
            git_status_summary,
            detected_stack,
            detected_package_managers,
            detected_config_files,
            suggested_commands,
            file_tree,
            ignored_dirs: IGNORED_DIRS.iter().map(|s| s.to_string()).collect(),
            scanned_at,
        })
    }

    fn detect_config_files(root: &Path) -> Vec<String> {
        let candidates = [
            "package.json",
            "pnpm-lock.yaml",
            "package-lock.json",
            "yarn.lock",
            "bun.lockb",
            "Cargo.toml",
            "pyproject.toml",
            "requirements.txt",
            "go.mod",
            "deno.json",
            "tsconfig.json",
            "vite.config.ts",
            "vite.config.js",
            "next.config.ts",
            "next.config.js",
            "tauri.conf.json",
        ];

        candidates
            .iter()
            .filter(|name| root.join(name).exists())
            .map(|s| s.to_string())
            .collect()
    }

    fn detect_package_managers(configs: &[String]) -> Vec<String> {
        let mut pm = vec![];
        if configs.iter().any(|c| c.contains("pnpm")) {
            pm.push("pnpm".to_string());
        }
        if configs.iter().any(|c| c.contains("package-lock")) {
            pm.push("npm".to_string());
        }
        if configs.iter().any(|c| c.contains("yarn")) {
            pm.push("yarn".to_string());
        }
        if configs.contains(&"bun.lockb".to_string()) {
            pm.push("bun".to_string());
        }
        pm
    }

    fn detect_stack(configs: &[String], pm: &[String]) -> Vec<String> {
        let mut stack = vec![];
        if pm.iter().any(|p| p == "pnpm" || p == "npm" || p == "yarn") {
            stack.push("Node".to_string());
        }
        if configs.contains(&"Cargo.toml".to_string()) {
            stack.push("Rust".to_string());
        }
        if configs.iter().any(|c| c.contains("tauri")) {
            stack.push("Tauri".to_string());
        }
        if configs.contains(&"pyproject.toml".to_string())
            || configs.contains(&"requirements.txt".to_string())
        {
            stack.push("Python".to_string());
        }
        if configs.contains(&"go.mod".to_string()) {
            stack.push("Go".to_string());
        }
        if configs.contains(&"deno.json".to_string()) {
            stack.push("Deno".to_string());
        }
        if configs
            .iter()
            .any(|c| c.contains("vite") || c.contains("next"))
        {
            stack.push("TypeScript".to_string());
            stack.push("React".to_string());
        }
        stack.sort();
        stack.dedup();
        stack
    }

    fn suggest_commands(configs: &[String], pm: &[String]) -> Vec<DetectedCommand> {
        let mut cmds = vec![];

        if configs.contains(&"Cargo.toml".to_string()) {
            cmds.push(DetectedCommand {
                command: "cargo check".to_string(),
                reason: "Rust project detected".to_string(),
                risk_level: "low".to_string(),
                allowed: true,
            });
            cmds.push(DetectedCommand {
                command: "cargo test".to_string(),
                reason: "Rust project detected".to_string(),
                risk_level: "low".to_string(),
                allowed: true,
            });
        }

        if pm.iter().any(|p| p == "pnpm") {
            cmds.push(DetectedCommand {
                command: "pnpm build".to_string(),
                reason: "pnpm project detected".to_string(),
                risk_level: "low".to_string(),
                allowed: true,
            });
            cmds.push(DetectedCommand {
                command: "pnpm test".to_string(),
                reason: "pnpm project detected".to_string(),
                risk_level: "low".to_string(),
                allowed: true,
            });
        }

        if pm.iter().any(|p| p == "npm") {
            cmds.push(DetectedCommand {
                command: "npm run build".to_string(),
                reason: "npm project detected".to_string(),
                risk_level: "low".to_string(),
                allowed: true,
            });
        }

        cmds
    }

    fn build_file_tree(
        root: &Path,
        depth: usize,
        max_depth: usize,
    ) -> Result<Vec<WorkspaceFileNode>, String> {
        if depth > max_depth {
            return Ok(vec![]);
        }

        let mut nodes = vec![];
        if let Ok(entries) = fs::read_dir(root) {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                if IGNORED_DIRS.contains(&name.as_str()) {
                    continue;
                }

                let metadata = match fs::metadata(&path) {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                if metadata.is_dir() {
                    let children = Self::build_file_tree(&path, depth + 1, max_depth).ok();
                    nodes.push(WorkspaceFileNode {
                        path: path
                            .strip_prefix(root)
                            .unwrap_or(&path)
                            .to_string_lossy()
                            .to_string(),
                        kind: FileNodeKind::Directory,
                        size: None,
                        children,
                        language: None,
                    });
                } else {
                    let size = metadata.len();
                    if size > MAX_FILE_SIZE_FOR_TREE {
                        continue;
                    }
                    let language = Self::guess_language(&name);
                    nodes.push(WorkspaceFileNode {
                        path: path
                            .strip_prefix(root)
                            .unwrap_or(&path)
                            .to_string_lossy()
                            .to_string(),
                        kind: FileNodeKind::File,
                        size: Some(size),
                        children: None,
                        language,
                    });
                }
            }
        }
        Ok(nodes)
    }

    fn guess_language(filename: &str) -> Option<String> {
        if filename.ends_with(".rs") {
            Some("rust".to_string())
        } else if filename.ends_with(".ts") || filename.ends_with(".tsx") {
            Some("typescript".to_string())
        } else if filename.ends_with(".js") || filename.ends_with(".jsx") {
            Some("javascript".to_string())
        } else if filename.ends_with(".py") {
            Some("python".to_string())
        } else if filename == "Cargo.toml" {
            Some("toml".to_string())
        } else {
            None
        }
    }

    fn detect_git_branch(root: &Path) -> Option<String> {
        // Simple implementation - in real code use git2 or command
        std::process::Command::new("git")
            .arg("-C")
            .arg(root)
            .arg("rev-parse")
            .arg("--abbrev-ref")
            .arg("HEAD")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }

    fn get_git_status_summary(root: &Path) -> Option<String> {
        std::process::Command::new("git")
            .arg("-C")
            .arg(root)
            .arg("status")
            .arg("--porcelain")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| {
                let lines: Vec<_> = s.lines().take(5).collect();
                format!("{} files modified", lines.len())
            })
    }

    fn current_timestamp() -> String {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        now.to_string()
    }
}
