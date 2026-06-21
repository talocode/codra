# Codra Code v0.2.3

## What's New

### Interactive TUI Home Screen
- Premium dark terminal interface with branded ASCII header
- Shows current provider, model, permission level, and active skills
- Composer placeholder with command hints
- Keyboard shortcut hints and onboarding tips
- Auto-detects terminal capabilities; falls back to classic REPL
- Use `--tui` or `--no-tui` flags to control behavior

### Skills Discovery & Recommendation
- Discover skills from `.codra/skills/`, `~/.codra/skills/`, and configured paths
- Recommend skills based on task type (debugging, UI, video, planning, etc.)
- Activate multiple skills with context protection (max 3, max 12000 chars)
- Skills context injected into provider prompts automatically

### Tera Authentication
- `codra-code login` - Authenticate with Tera account
- `codra-code logout` - Sign out and remove credentials
- `codra-code auth` - Show authentication status
- Protected commands require Tera authentication
- Token stored at `~/.codra/auth.json` with 600 permissions

### Local Auth Server
- Built-in auth server for testing (`src/auth/auth-server.ts`)
- Device auth flow with Supabase backend
- Support for local development and testing

### Auth Flow
1. User runs `codra-code login`
2. CLI creates device session via API
3. CLI opens browser to Tera sign-in page
4. User signs in with Tera account
5. Tera shows success page and approves device
6. CLI polls for auth result
7. CLI stores token at `~/.codra/auth.json`

### Commands
- `codra-code login` - Start Tera authentication
- `codra-code login --no-browser` - Headless login
- `codra-code logout` - Sign out
- `codra-code auth` - Show auth status
- `/login`, `/logout`, `/auth` - Slash commands
- `/skills` - List discovered skills
- `/skill <name>` - Activate a skill
- `/skills recommend <task>` - Recommend skills for a task
- `/skills active` - Show active skills
- `/skills use <n1,n2>` - Activate multiple skills
- `/skills clear` - Clear all active skills
- `/skills paths` - Show skill search paths

### Configuration
- `CODRA_AUTH_BASE_URL` - Custom Tera auth URL
- `CODRA_AUTH_DEV_BYPASS` - Development bypass (not for production)

## Installation

```bash
npm install -g @talocode/codra-code@0.1.6
```

## Usage

```bash
# Login
codra-code login

# Headless login
codra-code login --no-browser

# Check auth status
codra-code auth

# Logout
codra-code logout

# Run protected commands
codra-code --mock "/status"
```

## Development

```bash
# Build
npm run build

# Test
codra-code --version
codra-code --help
codra-code auth
codra-code --mock "/status"
```

## Support Talocode

Talocode builds open-source workflow layers for builders: coding agents, learning tools, trading intelligence, video workflows, and local-first automation.

If Codra Code helps you, you can support the work here:

[![Sponsor Abdulmuiz44](https://img.shields.io/badge/Sponsor-Abdulmuiz44-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Abdulmuiz44)

## License

MIT
