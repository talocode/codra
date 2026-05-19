# Shared protocol sync guardrail

Codra currently mirrors several Rust protocol domains into TypeScript files under `packages/shared/`.

Rust source of truth:

- `crates/codra-protocol/src/lib.rs`

Current TypeScript mirrors covered by the guardrail:

- `packages/shared/task-loop.ts`
- `packages/shared/planner.ts`
- `packages/shared/executor.ts`
- `packages/shared/verifier.ts`

That mirror is still manual, so this repo includes a lightweight guardrail to catch drift before it ships.

## What the guardrail checks

Run:

```bash
pnpm check:task-loop-protocol-sync
```

The script compares selected Rust protocol models against the shared TypeScript mirror files and fails when it detects drift in:

### Task-loop domain

- `TaskStatus`
- `Task`
- `TaskPlan`
- `TaskStep`
- `FileChange`
- `CommandRun`
- `VerificationResult`
- `TaskEvent`
- `WorkspaceFileNode`
- `DetectedCommand`
- `WorkspaceContext`
- `FileNodeKind` vs `WorkspaceFileNode.kind`

### Planner domain

- unions:
  - `PlanStatus`
  - `PlanningMode`
  - `PlanStepStatus`
  - `PlanStepKind`
- interfaces:
  - `TaskRequest`
  - `TaskContext`
  - `RiskItem`
  - `AssumptionItem`
  - `PlanDependency`
  - `PlanStep`
  - `ArchitectureProposal`
  - `ExecutionPlan`
  - `PlannerOutput`
  - `PlannerDecision`

### Executor domain

- unions:
  - `ExecutionStatus`
  - `ExecutionMode`
  - `StepExecutionStatus`
  - `ActionKind`
  - `PatchProposalStatus`
- interfaces:
  - `ExecutionState`
  - `ObservationRecord`
  - `PatchProposal`
  - `StepExecutionRecord`
  - `ActionIntent`

### Verifier domain

- unions:
  - `VerificationStatus`
  - `VerificationCheckKind`
  - `VerificationSeverity`
  - `FailureClassification`
- interfaces:
  - `VerificationCheck`
  - `VerificationFinding`
  - `RetryRecommendation`
  - `RetryRequest`
  - `VerificationState`

## What it does not check yet

This is intentionally lightweight. It does **not** yet verify:

- exact scalar type compatibility beyond field presence and enum/union variants
- optional-vs-required parity for every field
- integration, provider, runtime, or core shared domains
- generated TS from Rust schemas

## Expected workflow

Whenever you change one of the guarded Rust protocol domains:

1. Update `crates/codra-protocol/src/lib.rs`
2. Mirror the change in the matching file under `packages/shared/`
3. Run:
   ```bash
   pnpm check:task-loop-protocol-sync
   pnpm --filter desktop build
   cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
   ```

Whenever you change the TS mirror first:

1. Update the matching `packages/shared/*.ts` file
2. Confirm the Rust protocol already matches or update it
3. Run the same commands above

## Why this scope

The biggest current drift risk is still the desktop/Tauri/shared-protocol boundary. This guardrail now covers the highest-value domains in that path without adding a codegen pipeline yet.

## Better long-term upgrade

If Codra keeps expanding the shared model surface, the better long-term upgrade is one of:

- generate TS from Rust protocol definitions
- add more domain-specific sync checks beyond the current four domains
- move protocol mirrors into a schema-first flow
