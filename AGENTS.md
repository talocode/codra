# Agents Guidance

## Repo Purpose
This Monorepo houses Codra: an open-source, local-first Native AI coding agent equipped with custom routing, testing, and multi-file interaction workflows. 

## Canonical Docs to Read First
1. `docs/PLAN.md`: Ground truth for vision and goals.
2. `docs/ARCHITECTURE.md`: High-level system interaction graph.

## Expectations for Agents
- When engaging with this repository, always align modifications with the core architecture laid out in `docs/ARCHITECTURE.md`.
- Be highly precise with modifications in `apps/desktop` vs crates. Do not mix system logic into pure UI implementations.

## Change Policy
- Feature work requires tests if extending Rust capabilities.
- UI changes require Tailwind adherence and Dark-mode-first CSS values.

## Safety Constraints
- Only interact with paths mapped in `.codra` or configured user directories.
- Ignore paths globally `.gitignore`'d when performing contextual parses.

## Architecture Rules

1. Never import `apps/desktop` types into `codra-core` Rust crates (use `codra-protocol` / `@codra/shared` instead).
2. The UI shell must remain completely isolated from real file manipulation except through dedicated Tauri commands.
3. No fake backend mocked states in the React application except inside explicit `__mocks__` or test files.
4. React UI components must never call Rust/core logic directly or import `codra-core` runtime concepts. The UI renders state and requests actions; `codra-core` owns execution, validation, and state transitions.
5. React components must never call Tauri `invoke()` directly. All IPC calls must go through the approved typed gateway: `apps/desktop/src/lib/codraTaskApi.ts`.
6. React/`localStorage` must never become the source of truth for agent task state, approval state, execution state, memory, or protocol events. UI preferences (panels, last workspace, display settings) may be cached locally; authoritative state lives in `codra-memory` / Rust persistence.
7. Approval validity must never be enforced only by the UI. `codra-core` must reject invalid approvals: wrong task state, wrong workspace, stale task ID, or unauthorized transition.
8. React UI must never directly perform filesystem, Git, terminal, browser, deploy, or external side effects. Request side effects through approved Tauri commands and `codra-tools` only.
9. After any failed Tauri `invoke()` for task mutations, the UI must re-fetch task state from the backend source of truth (`getTask`) instead of trusting local optimistic state.

## CI Boundary Checks

Run from repo root before merging UI or crate boundary changes:

```bash
grep -r "invoke(" apps/desktop/src --include="*.ts" --include="*.tsx" -l
grep -rE "readFile|writeFile|fs\." apps/desktop/src --include="*.ts" --include="*.tsx" -l
grep -r "apps/desktop" crates/ -l
grep -r "codra-core" apps/desktop/src --include="*.ts" --include="*.tsx" -l
```

Expected results:

- `invoke(` should only appear in `apps/desktop/src/lib/codraTaskApi.ts` (the approved IPC gateway).
- `readFile`, `writeFile`, and `fs.` should not appear in React UI.
- `apps/desktop` should not appear in `crates/` (Rust crates must not depend on the desktop app).
- `codra-core` should not appear in `apps/desktop/src` (UI uses shared protocol types, not runtime internals).

## Definition of Done
- Feature is complete.
- Rust tests compiled and passing locally.
- UI elements verify successfully on `npm run dev` with no console errors.
- Visual integration has been user-reviewed.
