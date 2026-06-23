# Codra Agent-Native Protocol Adoption

How Codra will adopt the Talocode Agent-Native Protocol for safe, audited agent operations.

## Current State

Codra Code is a CLI-based AI coding agent. It currently operates through:

- Thread-based conversations
- File read/write operations
- Terminal command execution
- Git operations
- Model relay to external providers
- Plan-based task execution

## Planned Codra Actions

### Read-Only Actions (No Approval Required)

| Action | Risk | Description |
|--------|------|-------------|
| `codra.plan.create` | read | Create an execution plan |
| `codra.thread.resume` | read | Resume a conversation thread |
| `codra.context.compress` | read | Compress context for token efficiency |
| `codra.file.read` | read | Read file contents |
| `codra.git.status` | read | Check git repository status |
| `codra.git.diff` | read | View file differences |

### Write Actions (Approval Required)

| Action | Risk | Description |
|--------|------|-------------|
| `codra.plan.run` | medium | Execute an approved plan |
| `codra.file.write` | medium | Write or modify file contents |
| `codra.git.commit` | medium | Create a git commit |
| `codra.command.run` | high | Execute terminal commands |

### Destructive Actions (Unsupported)

- `codra.git.force_push` — not supported
- `codra.file.delete` — not supported
- `codra.database.drop` — not supported

## Context Providers

| Provider | Privacy | Description |
|----------|---------|-------------|
| `codra.thread` | workspace | Current conversation thread |
| `codra.plan` | workspace | Current execution plan |
| `codra.files` | workspace | File tree and contents |
| `codra.git` | workspace | Repository state |
| `codra.model` | private | Model relay configuration |

## Permission Gates

Codra actions declare required permissions:

- `codra:read` — read files, git status, context
- `codra:write` — modify files, create commits
- `codra:execute` — run terminal commands

Write and execute actions require approval before execution.

## Audit Trail

Every Codra action creates an audit event with:

- Action type and description
- Input parameters (sanitized)
- Execution result
- Timestamp
- Actor identifier

No raw secrets, API keys, or file contents exceeding safe limits are logged.

## Adoption Status

| Component | Status |
|-----------|--------|
| Action registry | Planned |
| Context providers | Planned |
| Permission gates | Planned |
| Audit logging | Partial (existing run logging) |
| Approval workflows | Existing approval system |
| Protocol endpoint | Not yet implemented |

## Migration Plan

1. Map existing Codra actions to protocol format
2. Add protocol endpoint to Codra API
3. Integrate permission gates into file/git operations
4. Enhance audit logging with protocol metadata
5. Add context providers for thread/plan/file state

## Limitations

- Codra CLI currently operates locally — protocol is for when Codra becomes multi-user
- File operations are the primary write actions
- Terminal commands are the highest-risk actions
- No hosted execution yet
