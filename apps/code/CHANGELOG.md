# Changelog

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

### Changed

- Default provider is now "mock" when no API key is configured
- Version bumped to 0.1.1
- Updated TypeScript configuration for NodeNext module resolution
- Improved error handling
- Updated README with quickstart and provider setup

### Fixed

- Non-interactive mode now works with piped input
- Fixed import paths for NodeNext module resolution
- Fixed command handling in non-interactive mode

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
