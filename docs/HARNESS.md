# Codra Project Harness

The project harness is a repo-local operating layer that helps Codra and other agents work safely inside a repository.

## What it contains

A harness lives in `.codra/harness/` and stores:

- `README.md` for project-specific guidance
- `project.json` for detected repo metadata
- `memory.md` for durable project notes
- `commands.json` for common commands
- `permissions.json` for safe local policy
- `release-checklist.md` for release discipline
- `demo-video-checklist.md` for release video tracking

## How to use it

- Run `codra harness init` to create the folder.
- Run `codra harness status` to see what was detected.
- Run `codra harness doctor` to validate the harness files.

## Why it matters

The harness keeps repo-specific context close to the codebase.
That makes local automation safer, more repeatable, and easier to reason about.

## Agent behavior

Agents should:

- read the harness before acting
- respect `permissions.json`
- prefer commands from `commands.json`
- keep `memory.md` updated with decisions that matter
- avoid acting outside the harness policy without approval
