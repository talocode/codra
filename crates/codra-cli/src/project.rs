use std::env;
use std::path::PathBuf;
use std::process::Command;

pub fn current_dir() -> PathBuf {
    env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

pub fn command_output(program: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(program).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

pub fn command_exists(program: &str) -> bool {
    Command::new(program).arg("--version").output().is_ok()
}

pub fn git_root() -> Option<PathBuf> {
    command_output("git", &["rev-parse", "--show-toplevel"]).map(PathBuf::from)
}

pub fn project_root() -> PathBuf {
    git_root().unwrap_or_else(current_dir)
}

pub fn git_branch() -> Option<String> {
    command_output("git", &["branch", "--show-current"])
}

pub fn git_status_short() -> Option<String> {
    command_output("git", &["status", "--short"])
}

pub fn is_inside_git_repo() -> bool {
    command_output("git", &["rev-parse", "--is-inside-work-tree"])
        .map(|value| value == "true")
        .unwrap_or(false)
}

pub fn which(program: &str) -> Option<String> {
    if cfg!(windows) {
        command_output("where", &[program])
            .and_then(|value| value.lines().next().map(str::to_string))
    } else {
        command_output("which", &[program])
    }
}

pub fn npm_platform_key() -> String {
    let platform = match env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    };
    let arch = match env::consts::ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        other => other,
    };
    format!("{platform}-{arch}")
}
