# Codra CLI

## Commands

- `codra init` creates starter repo guidance files.
- `codra doctor` checks local readiness.
- `codra understand` scans a repository and writes a local graph summary.
- `codra memory status` inspects memory files.
- `codra harness init` creates `.codra/harness/`.
- `codra harness status` shows detected harness state.
- `codra harness doctor` validates harness files and JSON.

## Harness init

`codra harness init` creates:

- `.codra/harness/README.md`
- `.codra/harness/project.json`
- `.codra/harness/memory.md`
- `.codra/harness/commands.json`
- `.codra/harness/permissions.json`
- `.codra/harness/release-checklist.md`
- `.codra/harness/demo-video-checklist.md`

It does not overwrite existing files unless `--force` is passed.
