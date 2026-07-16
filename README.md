<p align="center">
  <img src="assets/logo.png" width="180" alt="Codra Logo">
</p>

<h1 align="center">Codra</h1>

<p align="center">
  <strong>Open-source, local-first AI coding agent.</strong>
</p>

---

**Codra** is an open-source, local-first AI coding agent built for real software engineering. It helps developers plan, edit, execute, verify, and repair code changes inside their own projects while keeping humans in control.

## Install

```bash
# Terminal agent (recommended)
npm install -g @talocode/codra-code

# Rust CLI wrapper
npm install -g @talocode/codra
```

## Quick Start

```bash
# Test mode (no API key)
codra-code --mock

# Local-first with Ollama
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start

# With Tera API
codra-code login
codra-code start

# OpenAI-compatible
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-key
codra-code start
```

## Features

- **Tool-call agent loop** — LLM calls tools, observes results, repeats until done
- **Search & replace editing** — Exact and regex file patching
- **Auto-compaction** — Manages context window at 85% usage
- **Streaming responses** — Token-by-token output
- **Per-file locking** — Prevents concurrent write conflicts
- **Hook system** — Pre/post tool use events
- **Subagent spawning** — General-purpose, explore, and plan agents
- **Git workflow** — Branch, commit, status tools
- **Session persistence** — Conversation history saved locally
- **MCP server support** — Connect extended tool servers
- **Skills system** — Activate skills that influence agent behavior
- **Tera API integration** — First-class support for Tera AI
- **Command sandboxing** — Blocked patterns and allowlist
- **History repair** — Auto-fix corrupted conversation logs
- **Cost tracking** — Token and cost accounting per turn

## Providers

| Provider | Setup |
|----------|-------|
| **Tera** | `codra-code login` |
| **Ollama** | `export CODRA_PROVIDER=ollama` |
| **OpenAI** | `export CODRA_PROVIDER=openai` + `CODRA_API_KEY` |
| **OpenAI-compatible** | `export CODRA_BASE_URL` + `CODRA_API_KEY` |
| **Mock** | `codra-code --mock` |

## Architecture

- **Desktop Shell** — Tauri 2 (Rust + React)
- **Core Runtime** — `codra-core` (agent loop, tools, state machine)
- **Tooling** — `codra-tools` (fs, git, terminal, search)
- **Browser** — `codra-browser` (CDP-based local browser control)
- **CLI** — `codra-cli` (Rust) + `codra-code` (Node.js)
- **Daemon** — Local HTTP/SSE API server
- **Protocol** — Shared Rust/TypeScript types

## Development

```bash
pnpm install
pnpm dev          # Vite + Tauri dev
cargo check       # Rust checks
cargo test        # Rust tests
```

## Ecosystem

| Package | Description |
|---------|-------------|
| `@talocode/codra-code` | Terminal coding agent |
| `@talocode/codra` | Rust CLI wrapper |
| `codra-desktop` | Tauri desktop app |
| `codra-daemon` | Local API server |
| `codra-deploy` | Deployment layer |

## Security

- Code stays on your machine by default
- Agent actions require approval for destructive operations
- Secrets never exposed in prompts or logs
- All file operations and browser sessions run locally

## License

Apache-2.0

## Contact

Built by Talocode — talocodehq@gmail.com

[![Sponsor](https://img.shields.io/badge/Sponsor-Abdulmuiz44-ea4aaa?style=flat&logo=githubsponsors)](https://github.com/sponsors/Abdulmuiz44)
