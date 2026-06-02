# @codra/cli

npm package wrapper for the [Codra](https://github.com/talocode/codra) Rust CLI (`codra-cli` crate). Installs a global `codra` command that forwards to the native binary for your platform.

**Status: not published to npm yet.**

## Installation (coming soon)

```bash
npm install -g @codra/cli
codra --help
```

Until the package is published, use [local development](#local-development) below.

## Supported platforms

| Platform key | npm binary path | CI artifact name |
|--------------|-----------------|------------------|
| `linux-x64` | `bin/native/linux-x64/codra` | `codra-linux-x64` |
| `linux-arm64` | `bin/native/linux-arm64/codra` | `codra-linux-arm64` |
| `darwin-x64` | `bin/native/darwin-x64/codra` | `codra-darwin-x64` |
| `darwin-arm64` | `bin/native/darwin-arm64/codra` | `codra-darwin-arm64` |
| `win32-x64` | `bin/native/win32-x64/codra.exe` | `codra-win32-x64.exe` |

Optional per-platform npm packages may be added later if tarball size becomes too large. For now, all targets ship in `@codra/cli`.

## Local development (current host only)

```bash
cd packages/codra-npm-cli
npm run build
node bin/codra.js --help
node bin/codra.js run --task summarize-context --jsonl
npm test
```

`npm run build` runs `cargo build -p codra-cli --release` and copies the binary into `bin/native/<current-platform>-<arch>/` only.

## Multi-platform release (artifacts)

Release maintainers build per-platform binaries in CI, then package them into one npm tarball.

### Artifact naming

Place prebuilt files in `packages/codra-npm-cli/artifacts/` (or set `CODRA_ARTIFACTS_DIR`):

```
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

- Fails if any artifact is missing (default).
- Set `CODRA_ALLOW_PARTIAL_BINARIES=1` to package only available artifacts (local testing).

### Manual GitHub Actions release

Workflow: [`.github/workflows/codra-cli-release.yml`](../../.github/workflows/codra-cli-release.yml)

- Trigger: **workflow_dispatch** only (not automatic on push).
- Builds matrix: linux-x64, linux-arm64, darwin-x64, darwin-arm64, win32-x64.
- Job `package-npm`: downloads artifacts, runs `build:from-artifacts`, `npm test`, `npm pack`, uploads tarball.
- **npm publish is disabled by default.** Set workflow input `publish: true` and configure `NPM_TOKEN` secret to publish.

## Local vs release packaging

| Flow | Command | Result |
|------|---------|--------|
| Local dev | `npm run build` | Current host binary only |
| Release | `npm run build:from-artifacts` | All artifacts → `bin/native/*` |
| `npm pack` / `npm publish` | `prepack` | Uses artifacts if present, else host `build` |

## Publishing checklist

When ready to publish (maintainers only):

1. Run **Codra CLI release** workflow (or supply all artifacts locally).
2. `npm login` (only if publishing manually).
3. `npm test`
4. `CODRA_EXPECT_ALL_PLATFORMS=1 npm run pack:dry`
5. Verify tarball lists all five `bin/native/<platform>/` binaries.
6. Publish via workflow with `publish: true` **or** `npm publish --access public` (guarded).

Do not publish until all target binaries are included unless intentionally shipping a preview.

## Supported commands

Same as the Rust CLI:

```bash
codra run --task review-pr --jsonl
codra run --task explain-issue --jsonl
codra run --task summarize-context --jsonl
```

## GitHub context (optional)

| Variable | Purpose |
|----------|---------|
| `GITHUB_ACTIONS` | Detect Actions runtime |
| `GITHUB_REPOSITORY` | Repository slug |
| `GITHUB_EVENT_NAME` | Workflow event name |
| `GITHUB_EVENT_PATH` | Path to event JSON payload |
| `GITHUB_TOKEN` | Optional API enrichment (never printed) |

## Security

- No AI provider API calls in this CLI layer yet.
- Does not print `GITHUB_TOKEN` or other secrets in output.
- Wraps the existing Rust binary unchanged.

## License

MIT — see repository [LICENSE](https://github.com/talocode/codra/blob/main/LICENSE).