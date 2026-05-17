# Codra Agent Task Loop (v0.2.0)

## Overview

The Agent Task Loop is the core orchestration engine in Codra. It enables supervised, local-first AI coding workflows with human approval at every critical step.

## Current MVP Components

### TaskPlanner
- Creates tasks from workspace + user prompt
- Scans workspace using `WorkspaceScanner`
- Generates deterministic `TaskPlan`
- Moves task to `AwaitingApproval` status
- Records events (`task.created`, `workspace.scanned`, `task.planned`)

### TaskLifecycle
- `approve_task` — only allowed from `AwaitingApproval`
- `cancel_task` — allowed from several early states
- `mark_task_failed`

### TaskVerifier
- Runs only allowlisted safe commands
- Records `CommandRun` results
- On success → `Completed`
- On failure → `RepairPlanning` + simple repair plan

### Command Safety
- Strict allowlist for verification commands
- Rejects dangerous patterns (`rm -rf`, `sudo`, `git push --force`, publish, etc.)

### TaskStore
- File-based persistence at `.codra/tasks/`
- Supports events as JSONL

## State Machine (MVP)

Draft → Planning → AwaitingApproval → Approved → Verifying → (Completed | RepairPlanning)

## Current Limitations

- Command execution is simulated in MVP (real PTY execution coming later)
- Repair plans are basic
- No actual file modification yet
- No browser/runtime integration in this slice

## Next Steps

- Real command execution with PTY
- File change application with approval
- Full repair loop
- UI integration for plan review and approval

## Command Runner Abstraction

- `CommandRunner` trait for pluggable execution
- `RealCommandRunner` for production
- `MockCommandRunner` for fast, deterministic tests

## File Change Safety

- Path traversal protection
- Workspace boundary enforcement
- Automatic backups before modification
- Delete operations blocked by default in MVP

## Test Strategy

- All core services have unit tests
- Mock runner used for verifier tests
- Temp directories for scanner and file change tests
