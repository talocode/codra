# Codra Code Authentication (v0.4)

## Why Tera/Talocode Account Auth?

Codra Code is Talocode's local-first AI coding agent.

- Open-source / local usage remains fully trusted and works without any account.
- Hosted model/API usage (Gemini, OpenAI, Anthropic, xAI via Tera) requires authentication with a teraai.chat account.
- This prepares Codra for the Talocode business model:
  - Local-first stays free and private.
  - Hosted power is gated behind account identity.
  - Future credits, billing, and usage quotas will be tied to the Tera/Talocode account.

## Commands

- `codra login` (or `codra-code login`)
  - Starts device flow to teraai.chat
  - Supports `--no-browser` for headless
  - Supports `--auth-url` for custom (dev)

- `codra logout`
  - Clears local session

- `codra auth status` (or `codra auth`, `/auth`)
  - Shows signed-in status, email, expiry, hosted availability
  - Never prints tokens or secrets

- `/auth:token-path`
  - Shows safe path to auth file

## Storage

- Auth file: `~/.codra/auth.json`
- Permissions: 0600 on Unix
- Stores only: userId, email, accessToken (hashed use), expiresAt, source
- Never logged or printed in output

## Environment

- `CODRA_AUTH_BASE_URL` or `TERA_AUTH_BASE_URL` (default https://teraai.chat)
- `CODRA_AUTH_DEV_BYPASS=1` (dev only, sets fake session)

## Hosted vs Local

**Local (no auth needed):**
- mock
- ollama

**Hosted (requires auth or apiKey + account for full features):**
- openai
- gemini
- anthropic
- xai

In REPL or non-interactive:
- If hosted provider + not authenticated → clear message + suggestion to `codra login`
- Local always allowed

## Limitations (v0.4)

- Real Tera backend device flow may require running backend or use dev bypass for testing.
- No payment/billing implemented yet (future).
- Tokens are never exposed in logs/UI.

See also: README.md, docs/CODRA_CODE.md
