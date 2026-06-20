# Codra Understand

`codra understand` scans a repository, detects the package manager, languages, frameworks, scripts, docs, tests, routes, and file kinds, then writes two local artifacts:

- `.codra/graph/knowledge-graph.json`
- `.codra/graph/summary.md`

## Ignored paths

The scanner ignores:

- `.git`
- `node_modules`
- `dist`
- `build`
- `.next`
- `target`
- `.turbo`
- `coverage`
- `.codra`
- `.env` files

## Output shape

The knowledge graph is intentionally local-first and does not read secrets or file contents. It records repository structure and signals, not private values.

## Good follow-ups

After running `codra understand`, the next useful commands are usually:

- `codra init`
- `codra doctor`
- `codra memory status`
