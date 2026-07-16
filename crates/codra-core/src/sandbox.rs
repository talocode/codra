use std::collections::HashSet;

pub struct CommandSandbox {
    blocked_patterns: Vec<String>,
    allowed_commands: Vec<String>,
}

impl CommandSandbox {
    pub fn new() -> Self {
        Self {
            blocked_patterns: vec![
                "rm -rf /".to_string(),
                "sudo".to_string(),
                "git push --force".to_string(),
                "npm publish".to_string(),
                "yarn publish".to_string(),
                "ssh".to_string(),
                "curl | sh".to_string(),
                "curl | bash".to_string(),
                "wget | sh".to_string(),
                "chmod 777".to_string(),
                "mkfs".to_string(),
                "dd if=".to_string(),
                ":(){ :|:& };:".to_string(),
            ],
            allowed_commands: vec![
                "cargo check".to_string(),
                "cargo test".to_string(),
                "cargo build".to_string(),
                "pnpm install".to_string(),
                "pnpm build".to_string(),
                "pnpm test".to_string(),
                "pnpm lint".to_string(),
                "npm install".to_string(),
                "npm run build".to_string(),
                "npm test".to_string(),
                "git status".to_string(),
                "git diff".to_string(),
                "git log".to_string(),
                "git branch".to_string(),
            ],
        }
    }

    pub fn check_command(&self, command: &str) -> Result<SandboxVerdict, String> {
        for pattern in &self.blocked_patterns {
            if command.contains(pattern.as_str()) {
                return Err(format!(
                    "Command blocked by sandbox: matches pattern '{}'",
                    pattern
                ));
            }
        }

        let cmd_parts: Vec<&str> = command.split_whitespace().collect();
        if cmd_parts.is_empty() {
            return Err("Empty command".to_string());
        }

        if self.allowed_commands.iter().any(|allowed| {
            let allowed_parts: Vec<&str> = allowed.split_whitespace().collect();
            cmd_parts[..allowed_parts.len().min(cmd_parts.len())] == allowed_parts[..]
        }) {
            return Ok(SandboxVerdict::Allowed);
        }

        Ok(SandboxVerdict::RequiresReview {
            reason: format!(
                "Command '{}' is not in the allowlist. Review required.",
                cmd_parts[0]
            ),
        })
    }

    pub fn wrap_command(&self, command: &str) -> Result<String, String> {
        self.check_command(command)?;
        Ok(format!(
            "set -euo pipefail; timeout 120 {}",
            command
        ))
    }
}

impl Default for CommandSandbox {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug)]
pub enum SandboxVerdict {
    Allowed,
    RequiresReview { reason: String },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocked_commands() {
        let sandbox = CommandSandbox::new();
        assert!(sandbox.check_command("rm -rf /").is_err());
        assert!(sandbox.check_command("sudo apt install").is_err());
    }

    #[test]
    fn allowed_commands() {
        let sandbox = CommandSandbox::new();
        assert!(sandbox.check_command("cargo check").is_ok());
        assert!(sandbox.check_command("pnpm test").is_ok());
    }

    #[test]
    fn unknown_commands_require_review() {
        let sandbox = CommandSandbox::new();
        match sandbox.check_command("python run_script.py") {
            Ok(SandboxVerdict::RequiresReview { .. }) => {}
            _ => panic!("Expected RequiresReview"),
        }
    }
}
