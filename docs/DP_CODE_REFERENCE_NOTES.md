# DP Code Reference Notes

Reference repo studied: `https://github.com/Emanuele-web04/dpcode`
Temporary clone used for study: `/tmp/dpcode-reference`

## What DP Code does well

- Keeps the app centered on a single coding workflow instead of a dashboard.
- Makes the composer the main action surface.
- Uses a sidebar-first navigation model where threads and workspace context stay visible.
- Treats provider and model selection as a first-class product surface.
- Separates provider UX from provider runtime wiring.
- Stores thread shell state separately from heavy transcript detail so navigation stays responsive.
- Uses explicit availability and auth/runtime status labels rather than pretending every provider is ready.
- Has a real theme system instead of bolting light mode on later.
- Treats transcript history, task events, and thread bootstrap as structured state, not just raw chat text.

## Relevant architecture patterns observed

### 1. Workspace + thread shell
Relevant files:
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/threadDerivation.ts`
- `apps/web/src/threadSelectionStore.ts`
- `apps/web/src/lib/threadBootstrap.ts`

Patterns:
- lightweight thread shell / list state
- heavier thread detail derived separately
- stable grouping and selection logic
- new-thread bootstrap logic that can inherit workspace and model defaults

Why this matters for Codra:
- Codra already has task threads and workspace context
- Codra should keep sidebar rendering cheap and avoid coupling thread navigation to the full task detail payload
- new-thread creation should inherit the current workspace and selected model cleanly

### 2. Provider/model picker as a product system
Relevant files:
- `apps/web/src/components/chat/ProviderModelPicker.tsx`
- `apps/web/src/components/chat/PickerPanelShell.tsx`
- `apps/web/src/components/chat/PickerTriggerButton.tsx`
- `packages/contracts/src/model.ts`
- `packages/shared/src/model.ts`

Patterns:
- provider list and model list are distinct surfaces
- provider availability is metadata-driven
- favorites are persisted independently
- search is local and fast
- selected model label is resolved separately from raw slugs
- the UI can show a provider even when runtime/auth is not ready

Why this matters for Codra:
- Codra can ship the richer UX now without falsely claiming every provider executes today
- provider and model metadata should live in a shared frontend config layer, not be hardcoded inside a button
- favorites and selected model should persist in localStorage

### 3. Provider adapters instead of one-off switches
Relevant files:
- `apps/server/src/provider/Services/*.ts`
- `apps/server/src/provider/Layers/*.ts`
- `apps/server/src/provider/runtimeLayer.ts`
- `apps/server/src/provider/providerStatusCache.ts`

Patterns:
- one adapter per provider/runtime
- central registry / service layer
- explicit health and availability handling
- runtime logging and discovery isolated from UI

Why this matters for Codra:
- Codra should keep today’s task-loop backend intact
- future provider runtime work should land behind adapter boundaries, not inside the desktop UI
- for this slice, frontend provider options can expose `runtime pending` without touching execution semantics

### 4. Structured event and transcript handling
Relevant files:
- `apps/web/src/historyBootstrap.ts`
- `apps/web/src/lib/toolCallLabel.ts`
- `apps/server/src/provider/Layers/EventNdjsonLogger.ts`

Patterns:
- transcript history is summarized and budgeted deliberately
- tool/event labels are normalized for UI presentation
- runtime events are logged in a structured way

Why this matters for Codra:
- Codra already has task events and command traces
- task UI should present them as structured workflow artifacts: prompt, plan, approval, execution, report
- future memory and handoff work can build on structured events instead of scraping plain text

### 5. Real theming
Relevant files:
- `apps/web/src/theme/theme.logic.ts`
- `apps/web/src/theme/theme.seed.generated.ts`

Patterns:
- theme state is explicit
- light and dark are both designed, not one being accidental
- tokens drive surfaces, borders, and text contrast

Why this matters for Codra:
- Codra should move to tokenized theme variables for its primary shell surfaces
- dark can remain default, but light mode must be intentional

## What Codra should adapt

- Simple app framing: prompt, plan, approve, ship.
- Sidebar with `Threads` and `Workspace` tabs.
- Searchable thread list grouped by workspace/project.
- Central composer as the default empty-state action surface.
- Two-stage provider/model picker UX.
- Persisted favorites and selected model.
- Runtime labels like `ready` and `runtime pending`.
- Theme tokens that support both dark and light cleanly.
- Top-bar controls for handoff/push as placeholders, without backend fakery.

## What Codra should avoid

- Copying DP Code source files wholesale.
- Importing DP Code naming, branding, or visual identity directly.
- Pulling in DP Code’s broader server/runtime complexity into this desktop slice.
- Replacing Codra task-loop semantics with generic chat abstractions.
- Adding dashboard, pricing, billing, or fake control-plane language.
- Claiming provider execution support that Codra does not yet have.

## Mapping DP Code concepts to Codra concepts

- DP Code thread → Codra task thread
- DP Code workspace/project → Codra project folder
- DP Code provider/model selection → Codra selected model config
- DP Code transcript/log timeline → Codra task events and command trace
- DP Code handoff/push controls → future Codra/TeraAI handoff and git push flows
- DP Code provider availability/auth state → Codra runtime status labels
- DP Code theme tokens → Codra desktop shell theme variables
- DP Code draft/bootstrap model inheritance → Codra new-thread composer defaults

## Codra-native implementation direction

For this slice, Codra should:

1. Keep the existing Tauri + React + Rust task-loop architecture.
2. Redesign the desktop shell only.
3. Preserve current task APIs:
   - `codra_create_task`
   - `codra_approve_task`
   - `codra_execute_task`
   - `codra_cancel_task`
   - `codra_list_tasks`
   - `codra_get_task_events`
4. Record selected provider/model in frontend state for display even when runtime wiring is pending.
5. Keep provider runtime work as a future adapter layer, not part of this UI pass.

## Recommended boundaries for this branch

In scope:
- desktop UI shell redesign
- nested provider/model picker
- local theme support
- thread grouping/search UX
- task-view presentation updates

Out of scope:
- replacing Codra core runtime
- cloning DP Code architecture wholesale
- implementing all provider adapters
- changing memory branch work
- adding dashboard/admin surfaces
