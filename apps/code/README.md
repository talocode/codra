# Codra Code v0.4.0

## What's New in v0.4

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
- In `codra code` REPL, type `/` to open command picker menu
- Number or type /cmd to select
- Groups: Auth & System, Coding
- Includes /help /model /provider /auth /login /status /project /plan /build /review /test /commit /clear /exit etc.

### Model & Provider Picker
- `/model` opens interactive picker
- Select provider then model from registry
- Persists to ~/.codra/config.json via saveConfig
- Shows current, local vs hosted, auth notes

### Improved REPL Header
- Codra Code
- Workspace, Mode: local/hosted, Auth: signed in as xxx / not signed in
- Provider, Model, Context files
- Commands: type / for menu

### /status and /auth enhanced
- Git branch, auth details, config paths, slash cmd count, hosted avail
- Clear guidance

### Placeholder Commands
- /build /review /test /commit show "not wired yet" helpful msg

### Tests
- Added commands.test.ts for parser, auth, gating, persist, providers

### Docs
- Updated README, added docs/AUTH.md , docs/CODRA_CODE.md

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

## Limitations (v0.4)
- Some / commands are placeholders (build/review/test/commit)
- Full Tera backend device flow may use dev bypass for testing
- No payment/billing yet
- Rust CLI wrapper for "codra code" subcommand separate

Support Talocode - open source tools for builders.
