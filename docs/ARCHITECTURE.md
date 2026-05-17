# Architecture Definition

## System Overview

Codra comprises a local-first system using a Tauri runtime. The frontend handles visualization of complex agent states, while a heavy, modular Rust backend performs the orchestration, systems control, and contextual indexing.

Codra is the local agent within the Talocode ecosystem. All execution, file operations, browser interaction, and agent reasoning happen locally. Talocode will serve as the remote control plane in future phases.

## Top-Level Components

- **Desktop Shell (Tauri)**: Provides the application window, OS-native menus, and inter-process communication (IPC) capabilities.
- **Frontend (React)**: High-performance, reactive interface for viewing tasks, managing approvals, and agent dialog.
- **Agent Orchestrator (`codra-core`)**: The main state machine operating the agent. Contains sub-modules for Planning, Building, and Verifying.
- **Tooling Engine (`codra-tools`)**: Provides filesystem operations, Git management, search indexing, and terminal sandboxing.
- **Computer-Use Engine (`codra-browser`)**: A discrete sub-system utilizing CDP to spawn and control Chrome/Chromium, strictly separate from the Tauri interface webview.
- **Shared Data Layer (`codra-memory`, `codra-protocol`)**: Provides SQLite bindings and shared TS/RS schema representations.

## Desktop Shell Architecture

- Built on `Tauri 2`, using WRY/Tao for rendering.
- Communication with Rust happens exclusively through `tauri::command` handlers mapped onto an asynchronous event model.

## Frontend Architecture

- **React 18 + Vite** with strictly enforced dark mode styling.
- **Tailwind CSS** for component-level configuration.
- **Three-pane layout**: Workspace Navigator (Left), Editor/Diff Visualizer (Center), and Agent/Task Orchestration (Right).
- No frontend persistence for critical state; all truth derives from the Rust core.

## Agent Core Architecture (`codra-core`)

Operates as a state machine:

```
[IDLE] -> [RESEARCH] -> [PLAN] & [AWAIT_APPROVAL] -> [EXECUTE] -> [VERIFY] -> [DONE]
```

## Tool Layer Architecture (`codra-tools`)

A plugin-like interface standardizing tool signatures for models. Every tool returns deterministic, typed output schemas, ensuring safe auto-parsing. Includes `SafeToAutoRun` logic to pause runs needing user confirmation.

## Browser Runtime Architecture (`codra-browser`)

Built around standard CDP (`chrome-devtools-protocol` or `headless_chrome` in Rust).

Responsible for launching targets, injecting JavaScript listeners, extracting DOM snapshots into prompt-friendly formats, and managing screenshot buffers.

## Execution & Safety Flow

1. Model requested action over protocol.
2. Rust handler applies security filter.
3. If mutation or shell command, Rust invokes `ApprovalManager` which emits a `PendingApproval` event to Tauri.
4. UI awaits User confirmation.
5. Action runs in PTY or filesystem securely.

## Storage Extensibility

- **Checkpoints**: Written to `.codra/checkpoints` securely.
- **Metadata**: Indexed into `~/.codra-agent/data.sqlite`.
- **Migration Compatibility**: Runtime reads legacy `.forge` workspace data when `.codra` data is not yet present.

## Talocode Integration Direction (Planned)

Future versions will add:

- Connection to the Talocode control plane
- Remote task monitoring and mobile control
- Audit logging and permission systems
- Team workspace synchronization

These features will remain opt-in and will not compromise the local-first nature of the core agent.

## Known Limitations (Current)

- Browser runtime is in early development
- Full agent loop (planner → executor → verifier) is partially implemented
- Remote Talocode features are not yet available

See [docs/ROADMAP.md](ROADMAP.md) for planned milestones.