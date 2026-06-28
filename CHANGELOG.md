# Changelog

## 0.2.4

### Added
- **Composer UI** - New interactive composer interface replaces the basic header, with status line, footer, and improved visual feedback.
- **Auth HTML detection** - Smart detection of HTML responses from Tera auth endpoints with user-friendly error messages.
- **Package validation** - Enhanced release validation and dist consistency checks.

### Changed
- CLI now starts with composer UI by default (non-TUI mode) instead of a static header.
- Improved error messages for auth failures with HTML endpoint responses.
- Updated monorepo root dependency to `@talocode/codra-code@^0.2.4`.

## 0.1.5

### Added
- Added `codra harness init`, `codra harness status`, and `codra harness doctor`.
- Generated repo-local `.codra/harness/` guidance, commands, permissions, and release checklists.
- Documented the project harness in `docs/HARNESS.md` and CLI docs.
- Added a Remotion release video workflow and Codra v0.1.5 demo-video source.

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
