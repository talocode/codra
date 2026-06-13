# Changelog

## 0.1.4

### Fixed

- Fixed npm executable metadata so npm preserves the `codra` binary mapping during publish.
- Removed reliance on stale globally installed binaries during validation.

## 0.1.3

### Fixed

- Fixed npm `bin` metadata so `npx @talocode/codra` executes the packaged Codra binary.
- Prevented npx from falling back to stale globally installed binaries.

## 0.1.2

### Fixed

- Fixed the npm package runtime version mismatch so `codra --version` matches the published package version.
- Added validation to prevent stale bundled native binaries from being published.

## 0.1.1

- Added `codra understand` repo scanning and local knowledge-graph output.
- Wrote `.codra/graph/knowledge-graph.json` and `.codra/graph/summary.md`.
- Added repository signal detection for package manager, languages, frameworks, scripts, docs, tests, and routes.
- Documented the canonical npm package path as `packages/codra-npm-cli`.
- Moved the stale duplicate `packages/codra-cli` out of the workspace before the release work.

## 0.1.0

- First terminal release of Codra as `@talocode/codra`.
