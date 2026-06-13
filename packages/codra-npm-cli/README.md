# @talocode/codra

npm package wrapper for the [Codra](https://github.com/talocode/codra) Rust CLI (`codra-cli` crate). Installs a global `codra` command that forwards to the native binary for your platform.

**Status: publish-ready / coming soon. `@talocode/codra` is not published to npm yet. Do not publish until the release tarball contains every selected platform binary.**

## Installation

When published, install globally with pnpm or npm:

```bash
pnpm add -g @talocode/codra
npm install -g @talocode/codra
codra --help
codra
```

Until the package is published, use [local development](#local-development).

## Quick Start

```bash
codra
codra init
codra doctor
codra run --task summarize-context --jsonl
```

`codra` prints a clean terminal welcome with the current directory, git state, local mode, model status, GitHub context, and useful next commands.

## Commands

```bash
# Terminal entrypoint
codra
codra --help

# Initialize repo guidance files
codra init
codra init --force
codra init --dry-run

# Check local readiness
codra doctor
codra doctor --json

# Existing JSONL task protocol
codra run --task review-pr --jsonl
codra run --task explain-issue --jsonl
codra run --task summarize-context --jsonl
```

## Init

`codra init` detects the git root when available, then creates:

- `CODRA.md`
- `.codra/commands/review-pr.md`
- `.codra/commands/explain-issue.md`
- `.codra/agents/code-reviewer.md`

Existing files are preserved unless `--force` is passed. `--dry-run` reports planned changes without writing files.

## Doctor

`codra doctor` exits 0 unless an internal error occurs. It reports warnings instead of failing hard when optional tools are missing. Checks include current directory, git, branch, working tree state, cargo, Node, npm, pnpm, GitHub Actions detection, `GITHUB_TOKEN` presence without printing the value, `CODRA.md`, `.codra`, the `codra` binary on `PATH`, and the npm platform key.

## Supported platforms

| Platform key | npm binary path | CI artifact name |
|--------------|-----------------|------------------|
| `linux-x64` | `bin/native/linux-x64/codra` | `codra-linux-x64` |
| `linux-arm64` | `bin/native/linux-arm64/codra` | `codra-linux-arm64` |
| `darwin-x64` | `bin/native/darwin-x64/codra` | `codra-darwin-x64` |
| `darwin-arm64` | `bin/native/darwin-arm64/codra` | `codra-darwin-arm64` |
| `win32-x64` | `bin/native/win32-x64/codra.exe` | `codra-win32-x64.exe` |

Optional per-platform npm packages may be added later if tarball size becomes too large. For now, all selected targets ship in `@talocode/codra`.

## Local development

```bash
cd packages/codra-npm-cli
npm run build
node bin/codra.js --help
node bin/codra.js
node bin/codra.js doctor
node bin/codra.js run --task summarize-context --jsonl
npm test
```

`npm run build` runs `cargo build -p codra-cli --release` and copies the binary into `bin/native/<current-platform>-<arch>/` only.

## Multi-platform release

Release maintainers build per-platform binaries in CI, then package them into one npm tarball.

### Artifact naming

Place prebuilt files in `packages/codra-npm-cli/artifacts/` or set `CODRA_ARTIFACTS_DIR`:

```text
artifacts/codra-linux-x64
artifacts/codra-linux-arm64
artifacts/codra-darwin-x64
artifacts/codra-darwin-arm64
artifacts/codra-win32-x64.exe
```

Package into `bin/native/`:

```bash
npm run build:from-artifacts
```

- Fails if any artifact is missing by default.
- Set `CODRA_ALLOW_PARTIAL_BINARIES=1` only for local testing or explicit preview packaging.

### Manual GitHub Actions release

Workflow: [`.github/workflows/codra-cli-release.yml`](../../.github/workflows/codra-cli-release.yml)

- Trigger: `workflow_dispatch` only.
- Always builds linux-x64, linux-arm64, darwin-arm64, and win32-x64.
- Optional darwin-x64 can be enabled when Intel macOS packaging is required.
- Dry runs use `publish=false` and can package partial binaries for verification.
- Real publish uses `publish=true`, requires `NPM_TOKEN`, and must include every selected platform binary unless partial binaries are explicitly allowed.

## Local vs release packaging

| Flow | Command | Result |
|------|---------|--------|
| Local dev | `npm run build` | Current host binary only |
| Release | `npm run build:from-artifacts` | CI artifacts into `bin/native/*` |
| `npm pack` / `npm publish` | `prepack` | Uses artifacts if present, else host build |

## Publishing checklist

When ready to publish, maintainers should:

1. Run the Codra CLI release workflow or supply all artifacts locally.
2. Run `npm test`.
3. Run `CODRA_EXPECT_PLATFORMS=linux-x64,linux-arm64,darwin-arm64,win32-x64 npm run pack:dry`.
4. Add `darwin-x64` to `CODRA_EXPECT_PLATFORMS` when Intel macOS is selected.
5. Verify tarball lists every required `bin/native/<platform>/` binary.
6. Publish only via guarded workflow or `npm publish --access public` after verification.

## GitHub context

| Variable | Purpose |
|----------|---------|
| `GITHUB_ACTIONS` | Detect Actions runtime |
| `GITHUB_REPOSITORY` | Repository slug |
| `GITHUB_EVENT_NAME` | Workflow event name |
| `GITHUB_EVENT_PATH` | Path to event JSON payload |
| `GITHUB_TOKEN` | Optional API enrichment, never printed |

## Security

- No AI provider API calls are required for basic CLI usage.
- Does not print `GITHUB_TOKEN` or other secrets in output.
- Does not create `.env` files.
- Wraps the existing Rust binary and keeps the JSONL task protocol intact.

## License

MIT. See repository [LICENSE](https://github.com/talocode/codra/blob/main/LICENSE).
