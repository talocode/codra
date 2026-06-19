# Changelog

## Codra Code v0.1.4

Cross-platform downloadable CLI release packaging for Linux, Windows, and macOS.

### Added

- Cross-platform release packaging
- Linux x64 release archive
- Windows x64 release archive
- macOS arm64 and x64 release archives
- Portable CLI launcher scripts (bin/codra-code, bin/codra-code.cmd)
- GitHub Actions release workflow
- Release packaging script
- Platform-specific README files

### Changed

- Improved release documentation
- Updated package.json with packaging scripts

## Codra Code v0.1.3

npm-ready public release with npx support, enhanced MCP transport, improved provider validation, and stronger documentation.

### Added

- npx support for quick installation
- Enhanced MCP transport with stdio support
- Provider validation in `/doctor` command
- Improved error messages for provider configuration
- Better documentation for Ollama and OpenAI setup
- Professional demo video with captions
- Node.js engine requirement (>=18.0.0)

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
