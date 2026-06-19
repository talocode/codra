<p align="center">
  <img src="assets/logo.png" width="180" alt="Codra Logo">
</p>

<h1 align="center">Codra by Talocode</h1>

<p align="center">
  <strong>Open-source, local-first AI coding agent built for real software work.</strong>
</p>

<p align="center">
  <strong>Run agents inside your own development environment without giving up control of your codebase.</strong>
</p>

---

**Codra** is an open-source, local-first AI coding agent built for serious software engineering. It helps developers plan, edit, reason, execute, verify, and repair real code changes inside their own projects. It is designed for builders who want AI coding agents they can inspect, run locally, extend, and trust, not just closed cloud tools or chat-based coding assistants.

Codra is the local agent in the Talocode ecosystem, with Talocode serving as the future control plane for remote access, team workflows, audit logs, and orchestration across multiple local agents.

## Overview

Codra gives developers a powerful, supervised AI agent that lives on their machine. It understands your repository, proposes architectural plans, applies precise changes, verifies results, and can interact with local browsers, all while keeping you in full control.

## Why Codra Exists

AI coding should not only live inside closed platforms.

Developers should have access to open-source, local-first agents that can work inside real repositories, understand real codebases, execute real tasks, and keep humans in control of important changes.

Codra exists because serious software work needs more than autocomplete or chat. It needs supervised agents that can plan, act, verify, recover, and stay transparent.

- Open source by default — Developers should be able to inspect, extend, and contribute to the agent they use.
- Local-first execution — Your code, tools, terminal, browser, and project state should stay on your machine by default.
- Human control — Important actions should be visible, reviewable, and approved by the developer.
- Real engineering workflows — AI agents should help with planning, execution, verification, debugging, repair loops, and shipping production software.

## Codra Code

**Codra Code** is a terminal-based coding agent interface for real software work. It provides a clean CLI experience for interacting with AI models while keeping your code and data local.

### Install

```bash
# From npm
npm install -g @talocode/codra-code

# Or download from GitHub Releases
# https://github.com/talocode/codra/releases/latest
```

### Quick Start

```bash
# Run in test mode (no API key needed)
codra-code --mock

# Run with Ollama (local-first)
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start

# Run with OpenAI-compatible API
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
codra-code start
```

### Features

- **Real provider execution** — OpenAI-compatible, Ollama, and mock providers
- **Safe file editing** — Write, append, and patch files with confirmation
- **Git integration** — Status, diff, branch, log, commit
- **Plugin execution** — Built-in plugins for common tasks
- **MCP server support** — Connect to MCP servers for extended tools
- **Skills system** — Activate skills that influence agent behavior
- **Session persistence** — Conversation history saved locally
- **Non-interactive mode** — Execute commands from scripts

### Cross-Platform Downloads

Download portable releases from [GitHub Releases](https://github.com/talocode/codra/releases/latest):

- Linux: `codra-code-v0.1.4-linux-x64.tar.gz`
- Windows: `codra-code-v0.1.4-windows-x64.zip`
- macOS: `codra-code-v0.1.4-macos-arm64.tar.gz`

**Note:** Portable releases require Node.js >= 18.0.0.

### Slash Commands

- `/help` — Show available commands
- `/status` — Show project and provider status
- `/doctor` — Check system health
- `/read <path>` — Read a file
- `/write <path>` — Write a file (with confirmation)
- `/git` — Git summary
- `/git status` — Git status
- `/run <command>` — Run a command (with confirmation)
- `/skills` — List skills
- `/plugins` — List plugins
- `/mcp` — List MCP servers

See [apps/code/README.md](apps/code/README.md) for full documentation.

## Core Capabilities

- **Local-first coding agent** — Runs entirely on your machine with direct filesystem and terminal access.
- **Repo-aware context** — Maintains deep understanding of your project structure, Git history, and metadata.
- **Planner → Executor → Verifier → Repair loop** — Structured multi-step agent workflow with human approval checkpoints.
- **Native desktop experience** — Built with Tauri, Rust, React, and TypeScript for performance and security.
- **Browser-aware workflows** — Can control a local browser instance for preview verification and UI inspection (in progress).
- **Persistent project state** — Remembers workspace context across sessions.
- **Human-in-the-loop control** — Every significant action requires explicit approval.
- **Future Talocode integration** — Planned remote monitoring, team workflows, and orchestration through the Talocode control plane.

## How Codra Fits into Talocode

**Codra is the open-source local agent.**  
**Talocode is the future control plane.**

Codra handles all local execution, file operations, browser interaction, and agent reasoning inside your development environment. Talocode will provide remote access, team workflows, audit logs, and orchestration across multiple local agents.

## Architecture

Codra follows a clean layered architecture:

- **Desktop Shell** — Tauri 2 native application (Rust + webview)
- **Core Runtime** — `codra-core` crate handling agent orchestration, planning, and execution state
- **Tooling Layer** — `codra-tools` for filesystem, Git, terminal, and search operations
- **Browser Runtime** — `codra-browser` using Chrome DevTools Protocol for local web interaction
- **UI Layer** — React + Vite + Tailwind frontend for visualization and approvals
- **Protocol Layer** — Shared TypeScript/Rust types via `codra-protocol`
- **Persistence** — Task lifecycle state in `{workspace}/.codra/tasks/*.json` via `codra-core` `TaskStore` (`codra-memory` / SQLite is planned, not current)
- **Codra Code** — Terminal-based coding agent interface (Node.js + TypeScript)

All heavy operations (file changes, terminal commands, browser control) happen in Rust. The React UI only visualizes state and requests approvals. Codra Code provides a lightweight terminal alternative for developers who prefer CLI workflows.

See `docs/ARCHITECTURE.md` for deeper details.

## Getting Started

### Codra Code (Terminal Agent)

```bash
# Install
npm install -g @talocode/codra-code

# Run in test mode
codra-code --mock

# Run with real provider
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start
```

### Codra Desktop (Tauri App)

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development build: `pnpm dev`
4. Connect a local workspace and configure your preferred model provider

### Codra CLI (Rust)

```bash
cargo build -p codra-cli
codra --help
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development (Vite + Tauri)
pnpm dev

# Build the application
pnpm build

# Run Rust checks
cargo check
cargo test

# Codra Code
cd apps/code
npm install
npm run dev
```

## Codra Ecosystem

- **Codra Code** — Terminal coding agent interface (Node.js)
- **Codra CLI** — Rust-based CLI with event protocol and GitHub context
- **Codra Action** — GitHub automation layer
- **Codra Deploy** — Deployment and runtime layer

Codra Deploy status: Experimental foundation.

Example: `codra deploy plan --config codra.deploy.json`

Post-deploy browser verification: use [Agent Browser](https://github.com/talocode/agent-browser) via `talocode/agent-browser@v0` to inspect live deployed URLs. See [docs/codra-deploy/agent-browser.md](docs/codra-deploy/agent-browser.md).

## Codra CLI (event protocol + GitHub context)

```bash
cargo build -p codra-cli

# JSONL agent run events (no AI provider keys required)
codra run --task review-pr --jsonl
codra run --task summarize-context

# Optional: GITHUB_TOKEN enriches PR/issue data via GitHub API
```

See [crates/codra-cli/README.md](crates/codra-cli/README.md).

The installable npm wrapper also exposes `codra understand` for local repo graphing. See [docs/UNDERSTAND.md](docs/UNDERSTAND.md) and [docs/CLI.md](docs/CLI.md).

## Install Codra

### Codra Code (Recommended)

```bash
npm install -g @talocode/codra-code
codra-code --help
codra-code --mock
```

### Codra CLI

```bash
npm install -g @talocode/codra
codra --help
codra
```

The `@talocode/codra` package is a thin Node wrapper that launches the native Codra CLI built from `codra-cli`.

### Download Binaries

Download pre-built binaries from [GitHub Releases](https://github.com/talocode/codra/releases/latest):

- **Linux**: `codra-code-v0.1.4-linux-x64.tar.gz`
- **Windows**: `codra-code-v0.1.4-windows-x64.zip`
- **macOS**: `codra-code-v0.1.4-macos-arm64.tar.gz`

Portable releases require Node.js >= 18.0.0.

Codra also supports a repo-local project harness:

- `codra harness init`
- `codra harness status`
- `codra harness doctor`

See [docs/HARNESS.md](docs/HARNESS.md) for the harness format and usage.

## Use Codra with OpenAI-compatible, local, or custom providers

Codra can run against OpenAI-compatible APIs, proxies, OpenRouter, Mistral, xAI, DeepSeek, Ollama, LM Studio, and future providers using the global config file at `~/.codra/config.toml`.

### Codra Code Provider Setup

```bash
# Ollama (local-first, recommended)
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start

# OpenAI-compatible
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
codra-code start

# Test mode (no API calls)
codra-code --mock
```

### Codra CLI Provider Setup

```bash
codra --oss
codra --provider ollama
codra provider list
codra provider check
```

See [docs/MODEL_PROVIDERS.md](docs/MODEL_PROVIDERS.md), [docs/OSS_MODE.md](docs/OSS_MODE.md), and [docs/SECURITY_MODEL_CONFIG.md](docs/SECURITY_MODEL_CONFIG.md).

Local development can also run the same command surface directly from the Rust crate:

```bash
cargo run -p codra-cli --
cargo run -p codra-cli -- doctor
cargo run -p codra-cli -- init
cargo run -p codra-cli -- run --task summarize-context --jsonl
```

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full phased roadmap.

High-level milestones:

- [x] Local workspace connection and project indexing
- [x] Planner, executor, verifier, and repair loop
- [x] Browser runtime and deployment verification (`codra deploy verify <url>`)
- [x] `codra browser check <url>` alias
- [x] Codra Code terminal agent interface
- [x] Cross-platform release packaging
- [ ] Mobile remote control through Talocode
- [ ] Team/workspace sync through Talocode

## Security and Local-First Principles

Codra is built around strong local-first principles:

- Your code stays on your machine by default.
- Agent actions are visible and require approval for destructive operations.
- Secrets and credentials are never exposed in prompts or logs.
- Remote Talocode features are opt-in.
- All browser sessions and file operations run locally.

## Current Status

Codra is under active development. The core Tauri shell, agent orchestration framework, CLI pieces, daemon, and tooling layer are in progress or already present. Many advanced agent capabilities are still being built.

**Codra Code v0.1.4** is available with:
- Terminal coding agent interface
- Provider-agnostic model support (OpenAI, Ollama, Mock)
- Safe file editing with confirmation
- Git integration
- Plugin execution
- MCP server support
- Skills system
- Session persistence
- Cross-platform downloadable releases

## Contributing

We welcome contributions that align with Codra's focus on local-first, secure, and supervised AI engineering workflows.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

## Support Talocode

Talocode builds open-source workflow layers for builders: coding agents, learning tools, trading intelligence, video workflows, and local-first automation.

If Codra helps you, you can support the work through [GitHub Sponsors](https://github.com/sponsors/Abdulmuiz44).

## License

This project is licensed under the terms specified in the LICENSE file.

## Contact

Built by Talocode.  
Contact: talocodehq@gmail.com

---

<p align="center">
  <em>Codra by Talocode — Open-source. Local-first. Built for real software work.</em>
</p>


## Codra Local Daemon

Run the local API server:

```bash
cargo run -p codra-daemon -- --host 127.0.0.1 --port 4387
```

See [docs/CODRA_DAEMON.md](docs/CODRA_DAEMON.md) for API routes, SSE events, and security model.
