# Talocode Architecture Brief

## Why this document exists

This document captures architectural lessons learned while building and auditing **Codra**, **Agent Browser**, and **TeraAI** during Week 1 of the Senior Builder program.

Talocode ships many products fast. Speed without shared boundaries produces god modules, duplicated logic, and docs that lie about where state lives. This brief gives future contributors and agents a **shared engineering model** — not a tutorial, but a decision compass.

Use it before adding features, before reviewing PRs, and before trusting architecture diagrams that have not been checked against code.

---

## Principle 1: Boundaries before features

A feature must belong to a **layer** with a clear job. Do not ask "where does this file go?" first. Ask **which layer owns this behavior**.

### Codra layers (reference)

| Layer | Job |
|-------|-----|
| **React UI** | Render state, collect approvals, never own side effects |
| **IPC gateway** | Typed boundary between UI and Rust (`codraTaskApi.ts`) |
| **codra-core** | Agent state machine, validation, lifecycle transitions |
| **codra-tools / capabilities** | Filesystem, Git, terminal, browser, deploy — sandboxed |
| **Persistence** | Durable task state and events on disk |

**Question to ask:** Which layer owns this behavior? If the answer is "the UI, but also Rust, and also billing," the design is not ready to ship.

### Week 1 evidence

- Codra's IPC gateway pattern is sound: all `invoke()` calls live in one file.
- TeraAI's `PromptShell.tsx` violates this principle today — it owns UI, API client, parsing, and renderer orchestration in one shell.

---

## Principle 2: Gateway first

Every major capability should have **one gateway** — one typed surface that crosses a boundary.

| Product | Gateway | Status |
|---------|---------|--------|
| **Codra** | `apps/desktop/src/lib/codraTaskApi.ts` | Established |
| **Agent Browser** | `src/tools/*` (shared by CLI and MCP) | Established |
| **TeraAI** | Should be `lib/conversation/*` + hooks | **Missing** — logic lives in `PromptShell.tsx` |

### Rule

Before adding a feature, identify the gateway. If no gateway exists, **create the gateway first**, then add the feature behind it.

Scattered `invoke()` calls, duplicate CLI/MCP implementations, or inline `fetch('/api/generate')` in React components are architecture leaks — not convenience.

### Week 1 evidence

- Agent Browser: CLI and MCP both call `navigateToUrl`, `runSmokeCheck`, etc. One bug fix helps terminal users and AI agents alike.
- Codra: `AGENTS.md` now enforces single-gateway IPC with grep checks.
- TeraAI: planned PR 1 (hook extraction) + PR 2 (`submitPrompt` controller) is the correct fix order.

---

## Principle 3: Source of truth

UI caches are allowed. **Business state must have exactly one source of truth.**

| State type | Allowed location | Not allowed |
|------------|------------------|-------------|
| Task lifecycle (Codra) | `{workspace}/.codra/tasks/*.json` | React state, `localStorage` |
| Task events (Codra) | `.codra/tasks/events/*.jsonl` | UI-only event lists |
| UI preferences | `localStorage`, theme config | — |
| Agent Browser results | Structured JSON from tools layer | Raw Playwright objects in CLI/MCP output |

### Week 1 evidence

- **Drift 1 (fixed):** Docs claimed SQLite / `codra-memory`; code used JSON task files. Docs now match reality.
- **Drift 2 (fixed):** Failed mutations now re-fetch task state via `getTask()` instead of trusting stale React state.
- `localStorage` in Codra `App.tsx` for model selections and last workspace is acceptable **only** as UX cache — never for approval or execution state.

---

## Principle 4: Backend validates

The UI may assist (disable buttons, hide actions). **The backend/core must enforce.**

| Concern | UX guard | Authoritative guard |
|---------|----------|-------------------|
| Task approval | Hide button unless `awaiting_approval` | `TaskLifecycle::approve_task()` status check |
| Workspace pairing | Pass `workspacePath` from UI | `TaskStore::assert_task_workspace()` |
| URL safety (Agent Browser) | — | `assertSafeUrl()` in every tool |
| API gating (TeraAI) | Upgrade prompts | Route + `generate-answer` limits (today combined — split planned) |

A disabled button is not security. A stale UI after a failed `invoke()` is not recovery. Validation and recovery belong in core + gateway, not hope.

### Week 1 evidence

- Codra approval flow: UI requests, `codra-core` validates, `TaskStore` persists.
- Workspace validation added: mismatched `task.workspace_path` vs store root is rejected with an explicit error.

---

## Principle 5: Side effects belong in capability layers

Side effects need permission checks, logging, testability, and rollback. They do not belong in UI layers.

| Side effect | Owner |
|-------------|-------|
| Filesystem | `codra-tools`, Tauri commands |
| Git | `codra-tools` |
| Terminal / PTY | `codra-tools` |
| Browser / CDP | `codra-browser`, Agent Browser `PlaywrightBrowserProvider` |
| Deploy | `codra-deploy`, `codra-tools` |

**Never** place these directly inside React components, MCP handlers, or CLI argument parsers without delegating to the capability layer.

Agent Browser enforces this: only `playwright-provider.ts` imports `playwright-core`. CLI and MCP call `src/tools/*`.

---

## Principle 6: God modules are architecture debt

### Symptoms

- One file does 3+ unrelated jobs
- Difficult to test without mounting the entire app
- Every new feature lands in the same file
- Reviewers rubber-stamp large PRs

### Talocode examples (Week 1)

| Module | Jobs | Risk |
|--------|------|------|
| `PromptShell.tsx` (TeraAI) | Chat UI, API client, content parser, renderer orchestration, attachments, notes | **High** — missing gateway |
| `lib/generate-answer.ts` (TeraAI) | AI generation, billing, research, email, persistence | **High** — side-effect accumulation |
| `app/profile/page.tsx` (TeraAI) | Profile, usage, credits, memories, workflows | **Medium** — page-as-app |

### Preferred fix

1. Create a gateway (hook, controller, or `src/tools/*` module).
2. Move logic behind the gateway — **behavior unchanged**.
3. Split incrementally in safe PRs (state extraction before flow extraction).

Do not rewrite 900-line files in one PR.

---

## Week 1 outcomes

### Codra

- Boundary rules codified in `AGENTS.md` (6 must-never rules + CI greps)
- Persistence docs aligned with `.codra/tasks/*.json` reality
- Mutation recovery: UI re-fetches task state after failed `invoke()`
- Workspace validation: `assert_task_workspace()` on lifecycle mutations
- Architecture drift audit: 3 drifts identified, 2 fix PRs shipped/in flight

### Agent Browser

- Shared `src/tools/*` gateway confirmed — CLI and MCP converge on common behavior
- Safety centralized in `assertSafeUrl()` per tool
- Rust CLI crate flagged as experimental parallel stack — do not duplicate safety rules without contract tests

### TeraAI

- `PromptShell.tsx` identified as primary god module
- `lib/generate-answer.ts` identified as side-effect accumulator
- Gateway extraction planned: hook first, `lib/conversation/submitPrompt.ts` second
- Must-never rule drafted: UI shells do not grow product logic inline

---

## Talocode stack vision

| Product | Role |
|---------|------|
| **Codra CLI** | The coding agent — local-first orchestration |
| **Codra Action** | GitHub automation layer |
| **Codra Deploy** | Deployment and runtime validation (`codra deploy verify`, Agent Browser smoke checks) |
| **Agent Browser** | Browser runtime and verification layer for agents and CI |
| **LaunchPix** | Multimodal generation infrastructure (API-first launch visuals) |
| **TeraAI** | Learning and research companion |
| **ClipLoop** | Short-form promo video engine (secondary in Week 1) |

### How they connect

```
Developer / Agent
      │
      ├─► Codra (local agent) ──IPC──► codra-core ──► .codra/tasks/
      │         │
      │         └─► codra-browser / Agent Browser (page inspection)
      │
      ├─► Codra Action (CI automation)
      │
      ├─► Codra Deploy ──► Agent Browser verify (post-deploy smoke)
      │
      ├─► LaunchPix API (launch assets)
      │
      └─► TeraAI (learning loops — gateway extraction in progress)
```

**Codra is the local agent. Talocode is the control plane (future).** Each product should expose a clear gateway and own its source of truth.

---

## Architecture review checklist

Before approving a feature or PR, answer:

1. **Which layer owns it?** (UI, gateway, core, tools, persistence)
2. **Which gateway owns it?** (single file/module surface)
3. **Who validates it?** (core/domain — not UI-only)
4. **Who persists it?** (exact path or store)
5. **What is the source of truth?** (one answer, not "UI until we sync")
6. **What happens on failure?** (refresh from truth, explicit error, rollback path)
7. **Can violations be detected automatically?** (grep, test, CI check)

If any answer is missing, the PR is not ready — regardless of how well the feature works in a demo.

### Codra CI boundary checks (copy-paste)

```bash
grep -r "invoke(" apps/desktop/src --include="*.ts" --include="*.tsx" -l
grep -rE "readFile|writeFile|fs\." apps/desktop/src --include="*.ts" --include="*.tsx" -l
grep -r "apps/desktop" crates/ -l
grep -r "codra-core" apps/desktop/src --include="*.ts" --include="*.tsx" -l
```

---

## Related documents

- [AGENTS.md](../AGENTS.md) — enforceable Codra boundary rules
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Codra system map (keep aligned with code)
- [AGENT_TASK_LOOP.md](./AGENT_TASK_LOOP.md) — task loop persistence model
- [codra-deploy/agent-browser.md](./codra-deploy/agent-browser.md) — deploy verification flow

---

## Revision history

| Date | Change |
|------|--------|
| 2026-06-10 | Week 1 capstone — initial brief from Senior Builder audit |

*Maintainers: update this brief when a principle is violated and fixed, or when a new product joins the gateway model.*