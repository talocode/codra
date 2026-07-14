# Codra Code v0.2.5

## What's New

### Codra Code Terminal Composer

When launched interactively, `codra-code` now shows a clean centered terminal composer:

```
                          codra-code

        Local-first coding agent by Talocode

┌──────────────────────────────────────────────────────────────┐
│ Ask Codra to build, fix, review, test, or understand code... │
└──────────────────────────────────────────────────────────────┘

Build · <provider>/<model> · <mode> · confirm-edits

/ commands    tab autocomplete    @ attach file soon    ctrl+c exit

/workspace/projects/codra:main
v0.2.4
```

**Responsive layout:**
- Wide terminal: shows centered title, subtitle, boxed prompt, status, shortcuts, footer
- Narrow terminal (< 60 cols): minimal text-only layout that does not overflow

**Elements:**
- **Title**: `codra-code` in brand color (centered, bold on wide screens)
- **Subtitle**: `Local-first coding agent by Talocode`
- **Prompt box**: Box with placeholder text "Ask Codra to build, fix, review, test, or understand this repo..."
- **Status row**: `Build · provider/model · mode · edit-policy`
- **Shortcuts**: `/ commands`, `tab autocomplete`, `@ attach file soon`, `ctrl+c exit`
- **Footer**: workspace path with git branch, version number

### Auth + Hosted Gating
- Tera/Talocode account required for hosted providers (openai, gemini, anthropic, xai)
- Local providers (mock, ollama) work without auth
- `codra login` (or `codra-code login`)
- `codra auth status`
- `codra logout`
- Safe storage only, never prints tokens
- Supports TERA_AUTH_BASE_URL / CODRA_AUTH_BASE_URL
- Clear "Sign in with your Tera/Talocode account to use hosted Codra Code."

### Interactive Slash Command Interface
- In REPL, type `/` to open command picker menu
- Number or type /cmd to select
- Groups: Auth & System, Coding
- Includes /help /model /provider /auth /login /status /project /plan /build /review /test /commit /clear /exit etc.

### Model & Provider Picker
- `/model` opens interactive picker
- Select provider then model from registry
- Persists to ~/.codra/config.json via saveConfig
- Shows current, local vs hosted, auth notes

### Login Error Sanitization
- If Tera auth endpoint returns HTML (e.g. 404 page), Codra Code now sanitizes the output
- Shows clean message: "Login failed: Tera auth endpoint was not found."
- Never prints raw HTML, tokens, or secrets

### /status and /auth enhanced
- Git branch, auth details, config paths, slash cmd count, hosted avail
- Clear guidance

### Placeholder Commands
- /build /review /test /commit show "not wired yet" helpful msg

### Tests
- Added commands.test.ts for parser, auth, gating, persist, providers
- Composer UI state, status line, footer line
- Auth HTML sanitization
- Slash command routing

### Docs
- Updated README, added docs/AUTH.md, docs/CODRA_CODE.md

See full list in /help

## Tera Authentication Foundation
Codra Code uses Tera/Talocode account as the identity layer for hosted usage.
This prepares for future billing/credits tied to account.
Local-first always available.

Commands:
- codra login
- codra logout
- codra auth status

Token file: ~/.codra/auth.json (600 perms, never log contents)

## Slash Commands
Type / in interactive mode for picker.
Full list via /help

## Model Picker
/model shows providers and models, persists selection.

## Hosted vs Local
Mode: local  - mock/ollama, no auth needed
Mode: hosted - requires auth for Tera hosted models

## Installation
npm install -g @talocode/codra-code

## Usage
codra login
codra code
# then type /
# /model
# /status

## Development
cd apps/code
pnpm install
pnpm build
pnpm test

## Limitations (v0.2.5)
- Some / commands are placeholders (build/review/test/commit)
- Full Tera backend device flow may use dev bypass for testing
- No payment/billing yet
- Rust CLI wrapper for "codra code" subcommand separate
- `@ attach file` not yet implemented (shows "soon" placeholder)
- Login flow requires Tera device auth backend; if not deployed, shows clean error message

## Telemetry
`codra-code` sends an anonymous daily ping (once per day per instance) with:
- Anonymous instance ID (random UUID stored at `~/.codra/instance-id`)
- Package version, Node.js version, platform, architecture
- No PII, no code, no file paths, no IP stored

The ping is fire-and-forget — never blocks, never alerts on failure. To disable, unset the `CODRA_TELEMETRY_DISABLED` environment variable (future).

Support Talocode - open source tools for builders.
