# Changelog

## Codra Code v0.1.2

Turns the CLI into a real local-first coding-agent workflow with provider execution, safe file editing, git integration, plugin execution, skills in prompts, sessions, and release validation.

### Added

- `/doctor` command for system health checks
- `/git` commands for git integration (status, diff, branch, log, commit)
- `/append` and `/patch` commands for file editing
- `/diff` command for showing file changes
- `/pending`, `/apply`, `/discard` for edit workflow
- `/plugin run` for plugin execution
- `/skill <name>` for activating skills
- `/watch` for file watching
- `/last` for last command result
- Real system prompt for coding agent behavior
- Skills integration with agent prompts
- Command result tracking
- Safety checks for dangerous commands
- Non-interactive mode with `--yes` flag

### Changed

- Version bumped to 0.1.2
- Mock mode labeled as "Test Mode"
- Improved help command with organized sections
- Enhanced status command with more details
- Better error messages and user feedback

### Fixed

- Command handling in non-interactive mode
- File context properly added to prompts
- Provider validation and fallback behavior

## Codra Code v0.1.1

Added real provider architecture, mock mode, Ollama/OpenAI-compatible provider support, file-context prompting, and local session persistence.

### Added

- Provider layer with Mock, OpenAI, and Ollama providers
- Real agent loop for prompt → response flow
- File-context prompting with `/read <path> --context`
- Session persistence in `.codra/sessions/`
- Non-interactive command mode
- Piped input support
- Session commands: `/sessions`, `/session`, `/save`
- Config command: `/config`
- Secret protection and redaction
- Improved help documentation
- Demo script for showcasing features

## Codra Code v0.1.0

Initial Codra Code interface.

### Added

- Terminal coding-agent interface
- Slash-command layer
- Provider-agnostic model config
- Local-first project context
- Skill discovery scaffold
- MCP config scaffold
- Plugin discovery scaffold
- Starter Codra skills
- Starter plugin metadata
- Documentation
