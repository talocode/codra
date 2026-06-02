# @codra/cli

npm package wrapper for the [Codra](https://github.com/talocode/codra) Rust CLI (`codra-cli` crate). Installs a global `codra` command that forwards to the native binary for your platform.

## Installation (coming soon)

This package is **not published to npm yet**. When it is:

```bash
npm install -g @codra/cli
codra --help
```

## Local development

From the monorepo root (or this package directory):

```bash
cd packages/codra-npm-cli
npm run build
node bin/codra.js --help
node bin/codra.js run --task summarize-context --jsonl
npm test
```

`npm run build` runs `cargo build -p codra-cli --release` and copies the release binary into `bin/native/<platform>-<arch>/`.

## Supported commands

Same as the Rust CLI:

```bash
codra run --task review-pr --jsonl
codra run --task explain-issue --jsonl
codra run --task summarize-context --jsonl
```

Invalid tasks exit non-zero. With `--jsonl`, failures emit `codra.run.failed`.

## GitHub context (optional)

When running in GitHub Actions or with fixtures:

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