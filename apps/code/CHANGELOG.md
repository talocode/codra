# Changelog

## Codra Code v0.1.6 — Interactive TUI Home Screen

Added premium interactive TUI home screen for Codra Code's interactive mode. Features branded ASCII header, status display, command hints, and graceful fallback.

### Added

- TUI home screen with branded ASCII logo header
- Status line showing mode, provider/model, and permission level
- Active skills indicator
- Composer placeholder with command hint
- Keyboard shortcut hints (`/`, `tab`, `@`, `ctrl+c`)
- Onboarding tips (rotating daily)
- Project path and version footer
- `--tui` flag to force TUI mode
- `--no-tui` flag to use classic REPL
- Terminal capability detection (TTY, width, CI)
- Graceful fallback to classic text REPL when TUI unavailable

### Changed

- Interactive mode defaults to TUI when terminal supports it
- Classic REPL available via `--no-tui` flag
- Non-interactive commands unaffected

### Preserved

- All existing slash commands unchanged
- Non-interactive command behavior unchanged
- Auth flow unchanged

## Codra Code v0.1.6 — Skills Discovery & Recommendation

Added skill discovery, recommendation, and activation system. Skills are discovered from local paths, recommended based on task type, and their context is injected into provider prompts with protection against context bloat.

### Added

- Skill discovery from `.codra/skills/`, `~/.codra/skills/`, and configured paths
- Skill metadata extraction from SKILL.md files (description, tags, products)
- Task-to-skill recommendation mapping for debugging, UI, video, planning, search, and more
- `/skills` — list discovered skills
- `/skill <name>` — activate a skill
- `/skills recommend <task>` — recommend skills for a task
- `/skills active` — show active skills
- `/skills use <n1,n2>` — activate multiple skills
- `/skills clear` — clear all active skills
- `/skills paths` — show skill search paths and config
- Multi-skill activation with context protection (max 3 active, max 12000 chars)
- Skill context automatically injected into provider prompts
- Skill recommendations shown in `/plan <task>` output
- Active skills shown in `/status`
- `.codra/skills.json` config (paths, active, autoRecommend, maxActiveSkills, maxSkillContextChars)

### Changed

- Active skill system now supports multiple concurrent skills
- `/status` shows all active skills
- `/plan` shows skill recommendations when creating plans
- `/thread new` records active skills in thread metadata
- Help command updated with skills subcommands

### Security

- Context bloat protection: max 3 active skills, max 12000 chars total
- Truncation of long skill content
- No network access required for skill discovery
- No external repo references in skill metadata

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
