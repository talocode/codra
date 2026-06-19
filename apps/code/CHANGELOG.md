# Changelog

## Codra Code v0.1.6

Completed Tera-backed CLI authentication with device auth endpoints, secure local token storage, protected command gating, and auth status/logout commands.

### Added

- Tera account authentication with `codra-code login`
- Headless login with `--no-browser` flag
- Local development support with `--auth-url` flag
- `CODRA_AUTH_BASE_URL` environment variable
- Auth status command
- Logout command
- Protected command gating
- Device auth endpoints (start, poll, approve)
- SQL migration for device auth sessions
- Success page at `/codra-code/auth/success`
- Token validation on command execution
- Auth flow validation tests

### Changed

- Version bumped to 0.1.6
- Dev bypass restricted to non-production environments

### Security

- Token stored at `~/.codra/auth.json` with 600 permissions
- Token hash stored server-side
- Protected commands require authentication
- Tokens never printed in logs or output

### Validated

- ✓ Version returns 0.1.6
- ✓ Help works without auth
- ✓ Auth status works without auth
- ✓ Logout works without auth
- ✓ Protected commands require auth
- ✓ Protected commands work with valid token
- ✓ Token storage and retrieval works
- ✓ Expired token detection works

## Codra Code v0.1.5

Added Tera account authentication scaffolding.

### Added

- `codra-code login` command
- `codra-code logout` command
- `codra-code auth status` command
- `/login`, `/logout`, `/auth` slash commands
- Auth gate for protected commands
- Tera success page

## Codra Code v0.1.4

Cross-platform downloadable CLI release packaging.

### Added

- Cross-platform release packaging
- Linux, Windows, macOS release archives
- Portable CLI launcher scripts
- GitHub Actions release workflow

## Codra Code v0.1.3

npm-ready public release with npx support.

### Added

- npx support
- Enhanced MCP transport
- Provider validation
- Professional demo video

## Codra Code v0.1.2

Real coding-agent workflow with provider execution.

### Added

- Provider execution (OpenAI, Ollama, Mock)
- Safe file editing
- Git integration
- Plugin execution
- MCP server support
- Skills system
- Session persistence

## Codra Code v0.1.1

Real provider architecture and session persistence.

### Added

- Provider layer with Mock, OpenAI, and Ollama
- Session persistence
- File-context prompting
- Non-interactive mode

## Codra Code v0.1.0

Initial Codra Code interface.

### Added

- Terminal coding-agent interface
- Slash-command layer
- Provider-agnostic model config
- Local-first project context
