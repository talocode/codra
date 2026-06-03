# codra-cli

Local-first Codra CLI with JSONL event protocol and GitHub context adapter.

## Usage

```bash
# Build
cargo build -p codra-cli

# Codex-style terminal entrypoint
codra
codra --help

# Project setup and environment checks
codra init
codra init --force
codra init --dry-run
codra doctor
codra doctor --json

# JSONL event stream (no AI keys required)
codra run --task review-pr --jsonl
codra run --task explain-issue --jsonl
codra run --task summarize-context --jsonl

# Human-readable output
codra run --task summarize-context
codra run --task review-pr
```

`codra init` creates `CODRA.md`, `.codra/commands/`, and `.codra/agents/` starter files at the git root when available. It does not overwrite existing files unless `--force` is passed.

`codra doctor` checks git, cargo, Node, npm/pnpm, GitHub Actions environment, `GITHUB_TOKEN` presence without printing the value, Codra project files, the `codra` binary on `PATH`, and the npm platform key. Missing optional tools are warnings and exit 0.

## GitHub context

Real GitHub Actions mode is enabled only when `GITHUB_ACTIONS=true`. If `GITHUB_EVENT_PATH` is set outside Actions, the CLI parses it as a local fixture and keeps `mode` as `local`.

Reads GitHub Actions environment variables when present:

- `GITHUB_REPOSITORY`, `GITHUB_EVENT_NAME`, `GITHUB_EVENT_PATH`
- `GITHUB_SHA`, `GITHUB_REF`, `GITHUB_BASE_REF`, `GITHUB_HEAD_REF`
- `GITHUB_TOKEN` (optional — enables API enrichment)

Without `GITHUB_TOKEN`, the CLI still runs and emits warnings instead of failing.

## Event protocol

With `--jsonl`, each line is a JSON object:

| Type | When |
|------|------|
| `codra.run.started` | Run begins |
| `codra.context.loading` | Context load starts |
| `codra.context.loaded` | Context ready |
| `codra.task.started` | Task execution starts |
| `codra.task.summary` | Deterministic task output |
| `codra.task.completed` | Task finished |
| `codra.run.completed` | Success |
| `codra.run.failed` | Unrecoverable error (including invalid `--task` when `--jsonl` is set) |
| `codra.warning` | Non-fatal issue |

Fields: `type`, `runId`, `timestamp`, `task`, `source`, `data`.

## Extension points (Phase 3+)

- GitHub Action: `codra run --task review-pr --jsonl`
- PR comment upload from final `codra.task.summary`
- Desktop session viewer can tail JSONL events