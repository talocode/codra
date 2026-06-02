# @codra/cli

npm package wrapper for the [Codra](https://github.com/talocode/codra) Rust CLI (`codra-cli` crate). Installs a global `codra` command that forwards to the native binary for your platform.

**Status: not published to npm yet.**

## Installation (coming soon)

```bash
npm install -g @codra/cli
codra --help
```

Until the package is published, use [local development](#local-development) below.

## Local development

```bash
cd packages/codra-npm-cli
npm run build
node bin/codra.js --help
node bin/codra.js run --task summarize-context --jsonl
npm test
```

`npm run build` runs `cargo build -p codra-cli --release` and copies the release binary into `bin/native/<platform>-<arch>/` for **the current machine only** (for example `linux-arm64` on this host).

## Current limitation

- A local `npm run build` packages **only the current platform/arch** binary.
- `npm pack` / `npm publish` run `prepack`, which rebuilds and copies that same host binary into the tarball.
- End users on other platforms will see a clear error until release-built binaries for their OS/arch are included.
- Real public npm publishing needs release-built binaries for each supported target (see [Multi-platform release plan](#multi-platform-release-plan)).

This package does **not** ship multi-platform binaries today.

## Publishing checklist

When ready to publish (maintainers only):

1. `npm login`
2. `npm run build` — release Rust binary for this host
3. `npm test`
4. `npm run pack:dry` — verify tarball contents (runs `prepack` + dry-run checks)
5. Confirm tarball includes `README.md`, `package.json`, `bin/codra.js`, and `bin/native/<platform>-<arch>/codra` only
6. `npm publish --access public`

Do not publish until multi-platform release binaries are available for your intended audience, unless you are intentionally shipping a single-platform preview.

## Multi-platform release plan

Future release workflow should build and bundle:

| Target | Binary path |
|--------|-------------|
| `linux-x64` | `bin/native/linux-x64/codra` |
| `linux-arm64` | `bin/native/linux-arm64/codra` |
| `darwin-x64` | `bin/native/darwin-x64/codra` |
| `darwin-arm64` | `bin/native/darwin-arm64/codra` |
| `win32-x64` | `bin/native/win32-x64/codra.exe` |

Automation (GitHub Actions or similar) is not implemented yet.

## Supported commands

Same as the Rust CLI:

```bash
codra run --task review-pr --jsonl
codra run --task explain-issue --jsonl
codra run --task summarize-context --jsonl
```

Invalid tasks exit non-zero. With `--jsonl`, failures emit `codra.run.failed`.

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
- Local-first CLI foundation; wraps the existing Rust binary unchanged.

## License

MIT — see repository [LICENSE](https://github.com/talocode/codra/blob/main/LICENSE).