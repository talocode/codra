use codra_protocol::WorkspaceContext;

#[derive(Debug, Clone)]
pub struct CommandSafetyResult {
    pub allowed: bool,
    pub reason: String,
    pub risk_level: String,
}

pub fn is_command_allowed(
    command: &str,
    _context: Option<&WorkspaceContext>,
) -> CommandSafetyResult {
    let cmd_lower = command.to_lowercase();

    let dangerous_patterns = [
        "rm -rf",
        "sudo ",
        "su ",
        "| bash",
        "| sh",
        "chmod -R 777",
        "chown -R",
        "git reset --hard",
        "git clean -fd",
        "git push --force",
        "npm publish",
        "pnpm publish",
        "cargo publish",
        "ssh ",
        "scp ",
    ];

    for pattern in dangerous_patterns {
        if cmd_lower.contains(pattern) {
            return CommandSafetyResult {
                allowed: false,
                reason: format!("Command contains dangerous pattern: {}", pattern),
                risk_level: "high".to_string(),
            };
        }
    }

    let safe_commands = [
        "cargo check",
        "cargo test",
        "pnpm build",
        "pnpm test",
        "pnpm lint",
        "npm run build",
        "npm test",
        "npm run lint",
        "go test ./...",
    ];

    for safe in safe_commands {
        if cmd_lower.contains(safe) {
            return CommandSafetyResult {
                allowed: true,
                reason: "Safe verification command".to_string(),
                risk_level: "low".to_string(),
            };
        }
    }

    CommandSafetyResult {
        allowed: false,
        reason: "Command not in allowlist".to_string(),
        risk_level: "medium".to_string(),
    }
}
