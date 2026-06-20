# Security Model for Provider Config

Codra keeps provider credentials in the global user config at `~/.codra/config.toml`.

## Rules

- Project-local `.codra/harness/` cannot define providers.
- Project-local `.codra/harness/` cannot define API keys.
- Project-local `.codra/harness/` cannot define base URLs.
- Project-local `.codra/harness/` cannot define auth commands or credential helpers.
- Provider commands must never print secret values.

## Diagnostics

- `codra provider list` shows configured providers without secrets.
- `codra provider show` shows the active provider, model, base URL, wire API, and whether the required env key is present.
- `codra provider check` validates configuration and local connectivity with safe diagnostics.

