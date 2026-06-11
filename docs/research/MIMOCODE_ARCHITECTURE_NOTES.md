# MiMo-Code Architecture Research Notes

Research date: 2026-06-11  
Reference repo: [XiaomiMiMo/MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code)  
Codra repo: `/root/projects/codra`  
Method: Shallow clone + README/docs/source inspection. **No MiMo-Code source was copied into Codra.**

---

## What MiMo-Code Is (Short Summary)

MiMo-Code is a **terminal-native AI coding agent** built as a **fork of OpenCode**. It targets long-horizon, cross-session development: read/write code, run commands, manage Git, orchestrate subagents, and preserve project understanding through structured persistent memory rather than raw chat history.

Core differentiators vs a plain coding agent:

- **Structured memory** (project / session / task layers) with SQLite FTS5 search
- **Automatic checkpoints** and **context reconstruction** when the model window fills
- **Multiple primary modes** (`build`, `plan`, `compose`) plus spawned subagents
- **Goal / stop condition** with an independent judge model
- **Self-improvement loops** (`/dream`, `/distill`) that consolidate knowledge and reusable workflows

Stack (observed): Bun monorepo, `packages/opencode` (core), TUI/desktop/web packages, Effect-ts services, Drizzle/SQLite storage, provider abstraction from OpenCode lineage.

Configuration lives in `.mimocode/mimocode.json` (project) or `~/.config/mimocode/mimocode.json` (global). Memory artifacts live under a data directory (not in-repo): `memory/projects/<pid>/MEMORY.md`, `memory/sessions/<sid>/checkpoint.md`, `notes.md`, `tasks/<TID>/progress.md`.

---

## Files Read (MiMo-Code + Codra)

### MiMo-Code

| File / area | What we learned |
|-------------|-----------------|
| `README.md`, `README.zh.md` | Product positioning, feature list, memory layout, compose/goal/dream/distill |
| `LICENSE` | MIT for source code |
| `USE_RESTRICTIONS.md` | Additional use restrictions beyond MIT |
| `AGENTS.md` | Contributor style; OpenCode fork conventions; package-scoped testing |
| `package.json` | Bun workspaces; core in `packages/opencode` |
| `packages/opencode/src/memory/` | FTS reconcile + BM25 search over markdown memory files |
| `packages/opencode/src/session/checkpoint.ts` | Checkpoint writer, budgeted reads, `renderRebuildContext` |
| `packages/opencode/src/session/checkpoint-paths.ts` | Canonical paths for MEMORY, checkpoint, notes, tasks |
| `packages/opencode/src/session/goal.ts` | Independent judge model for stop conditions |
| `packages/opencode/src/agent/agent.ts` | `build` / `plan` / `compose` agents; `dream` / `distill` system agents |
| `packages/opencode/src/agent/prompt/dream.txt`, `distill.txt` | Self-improvement behavior boundaries |
| `packages/opencode/src/tool/memory.ts` | Agent-facing memory search tool |
| `packages/sdk/js/src/v2/gen/types.gen.ts` | Config schema for checkpoint budgets, rebuild caps |

**Not found:** `CLAUDE.md` in MiMo-Code clone. No in-repo `.mimocode/` sample directory (config is runtime/user-level).

### Codra (alignment baseline)

| File | Relevance |
|------|-----------|
| `AGENTS.md` | `.codra` workspace rules; task JSON is current source of truth |
| `docs/ARCHITECTURE.md` | `codra-memory` planned; `.codra/tasks/*.json` implemented |
| `docs/AGENT_TASK_LOOP.md` | State machine: plan → approve → verify → repair |
| `docs/PLAN.md` | Local-first, approval-gated agent vision |
| `docs/ROADMAP.md` | Phase 2 agent loop in progress |

---

## Architecture Patterns Worth Learning From

### 1. Persistent memory as a first-class layer

**What it does:** Separates memory by responsibility — project facts (`MEMORY.md`), session state (`checkpoint.md`), scratch (`notes.md`), per-task logs (`tasks/<id>/progress.md`). Indexed via SQLite FTS5; injected on session resume.

**Why it matters:** Chat transcripts are a poor durable store. Structured files survive compaction, are diffable, and can be budget-injected selectively.

**Codra adaptation:**

```
{workspace}/.codra/
  MEMORY.md              # project facts, architecture rules (durable)
  checkpoint.md          # current session/task snapshot
  notes.md               # scratch working notes (ephemeral-leaning)
  tasks/
    {task-id}/
      progress.md        # append-only execution log
      plan.md              # approved plan snapshot
      decisions.md       # design decisions with rationale
```

- Keep existing `.codra/tasks/*.json` as **machine source of truth** for lifecycle state.
- Add markdown memory as **human/agent-readable projection** synced from task events (not a second truth).
- Implement search later (`codra-memory` SQLite FTS) — v1 can be path-based reads + ripgrep.

---

### 2. Checkpointing

**What it does:** A dedicated `checkpoint-writer` subagent snapshots session state at context-fill thresholds (40%/60%/80% configurable). Writes structured `checkpoint.md` with section budgets.

**Why it matters:** Long tasks fail when the only recovery mechanism is "hope the model remembers." Checkpoints are explicit resume points.

**Codra adaptation:**

- PR 2: `codra checkpoint` command + `codra-core` hook at context threshold / task phase transitions.
- Write `checkpoint.md` from: active task id, last N events from `.codra/tasks/events/*.jsonl`, open blockers, next step.
- Align with existing `.codra/checkpoints` mention in `docs/ARCHITECTURE.md` (file backups vs session checkpoint — keep both concepts distinct).

---

### 3. Task progress logs

**What it does:** Tree-shaped task IDs (`T1`, `T1.1`) with `tasks/<TID>/progress.md` journals integrated into checkpoint rebuild.

**Why it matters:** Progress is queryable without replaying the full conversation.

**Codra adaptation:**

- Codra already has `task_id` + JSONL events — add `tasks/<task-id>/progress.md` as a summarized view.
- Append on state transitions (`planned`, `executed`, `verified`, `failed`).
- Link JSON task file ↔ markdown progress (single writer: `codra-core`).

---

### 4. Context reconstruction

**What it does:** When context nears limit, `renderRebuildContext` rebuilds from checkpoint + MEMORY + task progress + budgeted recent messages. Per-section token caps (checkpoint 11k, memory 10k, notes 6k, etc.).

**Why it matters:** Agents can run indefinitely without silent amnesia.

**Codra adaptation:**

1. Detect context pressure (token estimate from prompt builder).
2. Save checkpoint (sync).
3. Summarize task state into `progress.md` + `checkpoint.md`.
4. Re-inject only: `MEMORY.md` (relevant sections), active task `plan.md` + `progress.md` head, last K tool results.
5. Continue from checkpoint marker in `codra-core` session state.

Implement in Rust (`codra-core`) — not in React. UI shows "context rebuilt" event in task JSONL.

---

### 5. Plan / build / compose modes

**What it does:**

| Mode | MiMo-Code behavior |
|------|-------------------|
| `build` | Full tool permissions (default) |
| `plan` | Read-only edits; plans written to allowed plan paths |
| `compose` | Skill-driven orchestration for spec → ship workflows |

**Why it matters:** Same agent with different permission profiles reduces accidental mutations during design.

**Codra adaptation:** Formalize CLI + core modes (maps to existing state machine):

| Codra mode | Maps to | Permissions |
|------------|---------|-------------|
| `codra plan` | `Planning` / read-only | No fs write, no shell mutations |
| `codra build` | `Approved` → `Executing` | Full tools after approval |
| `codra review` | new | Diff/PR analysis only |
| `codra verify` | `Verifying` | Allowlisted commands only (exists) |
| `codra compose` | orchestrator | Chains plan → build → verify → report |

Codra advantage: **approval gate** already exists — plan mode is natural.

---

### 6. Goal / stop condition judging

**What it does:** `/goal "<condition>"` — when the working agent tries to stop, a **separate judge model** reads the transcript and returns `{ ok, reason, impossible? }`. Prevents optimistic "I'm done" without evidence.

**Why it matters:** Directly addresses false completion — critical for autonomous loops and Senior Builder workflows.

**Codra adaptation (PR 3):**

```
codra goal "Implement X and pass npm test"
```

Before `Completed`:

1. Run verifier (tests/build).
2. Judge prompt compares goal text + task events + verification output.
3. Emit `goal.judged` event with pass/fail.
4. Only transition to `Completed` on pass (or user override).

Store goal in `.codra/tasks/<id>/goal.md` or task JSON field. Judge runs in `codra-core`, not UI.

---

### 7. Dream / distill self-improvement

**What it does:**

- **`/dream`:** Scans session traces → extracts durable facts into project memory; prunes stale entries. Explicitly **not** for packaging workflows (that's distill).
- **`/distill`:** Detects repeated manual workflows → proposes skills/subagents/commands.

**Why it matters:** Institutional knowledge compounds across sessions.

**Codra adaptation (PR 5–6):**

| Command | Output | Guardrail |
|---------|--------|-----------|
| `codra dream` | Proposed diff to `.codra/MEMORY.md` | **User approval required** before merge |
| `codra distill` | Proposed recipe in `.codra/recipes/<name>.md` | User approval; never auto-edit `AGENTS.md` rules |

Dream sources: task JSONL + `progress.md` + `decisions.md` — not raw chat dump.

---

### 8. Subagent orchestration

**What it does:** Primary agent spawns subagents (`checkpoint-writer`, `dream`, `distill`, `explore`, `general`) with lifecycle tracking, parallel execution, cancellation. System-spawned types are restricted.

**Why it matters:** Parallelism + specialization without blocking the main thread.

**Codra adaptation:** **Defer to PR 7+.** Codra already has task loop + planned remote workers. Subagents need memory + checkpoint foundation first. Early step: single background "checkpoint writer" job in `codra-core` before full subagent registry.

---

### 9. Budgeted memory injection

**What it does:** Configurable per-section token caps for rebuild context; BM25-ranked search with relative score floor; reconcile index on search.

**Why it matters:** Prevents "inject everything" context blow-up.

**Codra adaptation:** Add `MemoryBudget` config in `codra-core`:

```toml
[memory.budget]
memory_md = 8000
checkpoint_md = 6000
progress_md = 4000
notes_md = 2000
```

Injection policy: task-scoped first → project `MEMORY.md` → never full chat history.

---

## What Codra Should NOT Copy

| Category | Reason |
|----------|--------|
| **Source code** | MIT allows study, but Codra is Rust/Tauri — direct paste is incompatible and risky |
| **Branding** | MiMo name, logos, banners, community QR flows |
| **MiMo-hosted services** | OAuth, MiMo Auto channel, ASR — separate ToS (`USE_RESTRICTIONS.md`, platform terms) |
| **OpenCode package layout** | Bun/Effect monorepo structure ≠ Codra crates architecture |
| **`.mimocode/` config path** | Use `.codra/` — already established |
| **In-data-dir memory only** | Codra is workspace-local-first; memory should live in `{workspace}/.codra/` |
| **Unbounded dream/distill** | Never auto-rewrite project rules or `AGENTS.md` without explicit user approval |
| **Chat-as-memory** | Transcript-only recovery — explicitly forbidden for Codra durable state |

**Licensing note:** MiMo-Code README states source is [MIT](./LICENSE) but use is also subject to [Use Restrictions](./USE_RESTRICTIONS.md) and MiMo trademark/service terms for hosted offerings. **Architecture inspiration: yes. Direct implementation copy: no.**

---

## Codra Adaptation Roadmap (Proposed PR Sequence)

| PR | Name | Scope | Depends on |
|----|------|-------|------------|
| **1** | **Codra Memory v1** | `.codra/MEMORY.md`, `checkpoint.md`, `notes.md`, `tasks/<id>/{progress,plan,decisions}.md`; core writers from task events | — |
| **2** | **Codra Checkpoint** | Save/restore session state; context threshold triggers | PR 1 |
| **3** | **Codra Goal** | Goal file + completion judge before `Completed` | PR 1, verifier |
| **4** | **Codra Compose** | Spec → plan → build → verify → report orchestration | PR 1–3, task loop |
| **5** | **Codra Dream** | Extract durable lessons → proposed MEMORY diff (approval gated) | PR 1 |
| **6** | **Codra Distill** | Repeated workflows → `.codra/recipes/` (approval gated) | PR 5 |
| **7** | **Subagent orchestration** | Parallel workers, checkpoint-writer background actor | PR 1–2 |
| **8** | **codra-memory SQLite FTS** | Indexed search over markdown memory (optional acceleration) | PR 1 |

---

## Recommended First PR: Codra Memory v1

**Why this is the safest first step:**

1. Aligns with Codra's existing `.codra/` workspace model — no new global state silo.
2. Complements (does not replace) `.codra/tasks/*.json` source of truth.
3. No new model/provider dependencies — pure filesystem + event projection.
4. Unblocks every downstream pattern (checkpoint, goal, compose, dream).
5. Low risk: markdown files are auditable, diffable, and user-editable.

### Proposed layout (canonical)

```
{workspace}/.codra/
  MEMORY.md                 # durable project facts & architecture rules
  checkpoint.md             # current session resume snapshot
  notes.md                  # scratch pad (session-scoped)
  tasks/
    {task-id}/
      progress.md           # append-only execution log
      plan.md               # approved plan snapshot
      decisions.md          # design decisions & rationale
  tasks/*.json              # (existing) machine source of truth
  tasks/events/*.jsonl      # (existing) event stream
```

### PR 1 deliverables (sketch)

- `codra-core` memory module: path resolver, templates, atomic writes
- Event hooks: on `task.planned` → write `plan.md`; on transitions → append `progress.md`
- `MEMORY.md` template seeded on workspace init (like `CODRA.md` pattern)
- CLI: `codra memory status` (list files + last updated)
- Tests: path guards, workspace boundary, no writes outside `.codra/`
- Docs update: `docs/ARCHITECTURE.md` memory section

**Explicitly out of scope for PR 1:** SQLite FTS, judge model, subagents, auto-dream.

---

## Must-Never Rules (Codra)

1. **Never** store durable agent memory only in chat history or React state.
2. **Never** inject all memory blindly — always budgeted and task-relevant.
3. **Never** let dream/distill rewrite project rules without user approval.
4. **Never** copy MiMo-Code implementation directly — Codra-native Rust/Tauri only.
5. **Never** conflate customer-facing task JSON truth with markdown projections (JSON leads, markdown follows).
6. **Never** mix worker/cron secrets with user API keys (LaunchPix lesson applies to Codra control plane too).

---

## Codra vs MiMo-Code (Gap Analysis)

| Capability | MiMo-Code | Codra today | After roadmap |
|------------|-----------|-------------|---------------|
| Task persistence | `tasks/<TID>/progress.md` + tree IDs | `.codra/tasks/*.json` + JSONL | Both: JSON truth + md projection |
| Project memory | `MEMORY.md` + FTS | Planned (`codra-memory`) | PR 1 markdown, PR 8 FTS |
| Session checkpoint | Auto subagent writer | Mentioned, not structured | PR 2 |
| Context rebuild | `renderRebuildContext` | Not implemented | PR 2 |
| Modes | build/plan/compose | Partial state machine | PR 4 formalize |
| Goal judge | `/goal` + judge model | Not implemented | PR 3 |
| Dream/distill | System agents | Not implemented | PR 5–6 |
| Approval gate | Lighter | **Strong** (Codra advantage) | Keep and extend |
| Desktop UI | TUI-primary | Tauri three-pane | Memory panel reads `.codra/` files |

---

## Next Step After This Doc

**Build Codra Memory v1 (PR 1).** It is the highest-leverage foundation MiMo-Code points to — everything else (checkpoint, goal, compose, dream) assumes structured, workspace-local memory exists.