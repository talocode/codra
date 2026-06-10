<p align="center">
  <img src="assets/logo.png" width="180" alt="Codra Logo">
</p>

<h1 align="center">Codra by Talocode</h1>

<p align="center">
  <strong>Local-first AI coding agent for serious engineering.</strong>
</p>

<p align="center">
  <strong>Codra is the local agent. Talocode is the control plane.</strong>
</p>

---

**Codra** is a local-first AI coding agent built for real software work. It combines repo-aware orchestration, planning, execution, verification, repair loops, browser-aware workflows, and a native desktop experience to help builders ship software faster without losing control of their codebase.

Codra is part of the Talocode ecosystem, a local-first platform for coding agents, browser agents, and developer automation.

## Overview

Codra gives developers a powerful, supervised AI agent that lives on their machine. It understands your repository, proposes architectural plans, applies precise changes, verifies results, and can interact with local browsers — all while keeping you in full control.

## Why Codra Exists

Most AI coding tools today are either cloud-dependent, opaque, or lack proper supervision mechanisms. Codra was built to solve this by being:

- Truly local-first
- Transparent and auditable
- Designed for serious, production-grade engineering work
- Part of a larger ecosystem (Talocode) that will eventually offer remote and team capabilities

## Core Capabilities

- **Local-first coding agent** — Runs entirely on your machine with direct filesystem and terminal access.
- **Repo-aware context** — Maintains deep understanding of your project structure, Git history, and metadata.
- **Planner → Executor → Verifier → Repair loop** — Structured multi-step agent workflow with human approval checkpoints.
- **Native desktop experience** — Built with Tauri, Rust, React, and TypeScript for performance and security.
- **Browser-aware workflows** — Can control a local browser instance for preview verification and UI inspection (in progress).
- **Persistent project state** — Remembers workspace context across sessions.
- **Human-in-the-loop control** — Every significant action requires explicit approval.
- **Future Talocode integration** — Will support remote monitoring and control through the Talocode control plane.

## How Codra Fits into Talocode

**Codra is the local agent.**  
**Talocode is the control plane.**

Codra handles all local execution, file operations, browser interaction, and agent reasoning. Talocode will provide the remote control layer, mobile access, team workspaces, audit logs, and orchestration across multiple Codra instances.

## Architecture

Codra follows a clean layered architecture:

- **Desktop Shell** — Tauri 2 native application (Rust + webview)
- **Core Runtime** — `codra-core` crate handling agent orchestration, planning, and execution state
- **Tooling Layer** — `codra-tools` for filesystem, Git, terminal, and search operations
- **Browser Runtime** — `codra-browser` using Chrome DevTools Protocol for local web interaction
- **UI Layer** — React + Vite + Tailwind frontend for visualization and approvals
- **Protocol Layer** — Shared TypeScript/Rust types via `codra-protocol`
- **Persistence** — Local SQLite via `codra-memory`

All heavy operations (file changes, terminal commands, browser control) happen in Rust. The React UI only visualizes state and requests approvals.

See `docs/ARCHITECTURE.md` for deeper details.

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development build: `pnpm dev`
4. Connect a local workspace and configure your preferred model provider

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
```

## Codra Ecosystem

- Codra CLI: coding agent
- Codra Action: GitHub automation layer
- Codra Deploy: deployment and runtime layer

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

## Installable CLI roadmap

The `@codra/cli` package is publish-ready work in progress and is not published to npm yet. Once maintainers verify the release tarball includes every selected platform binary, users will be able to install Codra globally:

```bash
pnpm add -g @codra/cli
npm install -g @codra/cli
codra --help
codra
```

Today, local development can run the same command surface from the Rust crate or npm wrapper:

```bash
cargo run -p codra-cli --
cargo run -p codra-cli -- doctor
cargo run -p codra-cli -- init
cargo run -p codra-cli -- run --task summarize-context --jsonl
```

The [`@codra/cli`](packages/codra-npm-cli/) package is a thin Node wrapper that spawns the native `codra` binary built from `codra-cli`. Multi-platform npm distribution targets Linux, macOS, and Windows; the manual [release workflow](.github/workflows/codra-cli-release.yml) packages platform binaries before guarded publish. npm publish remains off by default and must not run until tarball contents are verified (see [packages/codra-npm-cli/README.md](packages/codra-npm-cli/README.md)).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full phased roadmap.

High-level milestones:

- [ ] Local workspace connection and project indexing
- [ ] Planner, executor, verifier, and repair loop
- [x] Browser runtime and deployment verification (`codra deploy verify <url>`)
- [x] `codra browser check <url>` alias
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

Codra is under active development. The core Tauri shell, agent orchestration framework, and basic tooling layer are in place. Many advanced agent capabilities are still being built.

## Contributing

We welcome contributions that align with Codra’s focus on local-first, secure, and supervised AI engineering workflows.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the terms specified in the LICENSE file.

## Contact

Built by Talocode.  
Contact: talocodehq@gmail.com

---

<p align="center">
  <em>Codra by Talocode — Local agent. Serious engineering.</em>
</p>


## Codra Local Daemon

Run the local API server:

```bash
cargo run -p codra-daemon -- --host 127.0.0.1 --port 4387
```

See [docs/CODRA_DAEMON.md](docs/CODRA_DAEMON.md) for API routes, SSE events, and security model.
