# Codra Deploy

Codra Deploy is the deployment and runtime layer of the Codra ecosystem.

## Vision

Codra Deploy is an open-source Render-style deployment platform for developers who want simple app deployments, logs, domains, workers, and databases on their own infrastructure.

## Positioning

Codra Deploy is for developers who want a small, predictable deployment surface they can run on their own infrastructure without adopting a hosted control plane.

## Ecosystem Relationship

- Codra CLI writes, reviews, and fixes code locally.
- Codra Action automates GitHub pull request and issue workflows.
- Codra Deploy runs apps, workers, jobs, logs, domains, and runtime services on user-owned infrastructure.
- Later, Codra can read failed deploy logs and propose fixes.
- [Agent Browser](https://github.com/talocode/agent-browser) verifies live deployed URLs after release.

## Post-deploy browser verification

HTTP 200 is not enough. A deploy can succeed while the frontend is still broken:

- blank or mostly empty pages
- JavaScript console crashes
- failed assets or API calls after page load
- broken render states that curl and health checks miss

Codra Deploy can run [Agent Browser](https://github.com/talocode/agent-browser) after deployment to inspect the live public URL in a real browser.

Agent Browser catches:

- page load and snapshot issues
- console errors
- failed network requests
- optional screenshot evidence
- optional blank/blur vision warnings

GitHub Action usage is available and externally verified:

```yaml
uses: talocode/agent-browser@v0
```

See:

- [agent-browser.md](agent-browser.md)
- [examples/codra-deploy/github-actions/agent-browser-smoke.yml](../../examples/codra-deploy/github-actions/agent-browser-smoke.yml)
- [External verification run](https://github.com/talocode/agent-browser-action-test/actions/runs/27259693056)

Future Codra loop:

1. Codra Deploy publishes a URL.
2. Agent Browser returns a structured pass/warn/fail report.
3. Codra reads the report, explains the issue, and suggests a fix.

## Commands

### `codra deploy plan`

Validate `codra.deploy.json` and render a safe deployment plan.

```bash
codra deploy plan --config codra.deploy.json
```

### `codra deploy up`

Prepare a local Docker deployment. **Dry-run is the default.**

```bash
codra deploy up --dry-run
codra deploy up --config codra.deploy.json --service web --json
```

### `codra deploy up --execute`

Run Docker build and run commands for supported services.

Real execution requires **both**:

1. CLI flag: `--execute`
2. Environment variable: `CODRA_DEPLOY_ENABLE_EXECUTE=1`

```bash
CODRA_DEPLOY_ENABLE_EXECUTE=1 codra deploy up --execute --service web
```

If either gate is missing, Codra prints planned Docker commands only and refuses execution.

### `codra deploy logs`

Show logs for a deployed web or worker container.

```bash
codra deploy logs --service web --tail 100
```

## Example Flow

```bash
codra deploy plan --config examples/codra-deploy/docker-nextjs/codra.deploy.json
codra deploy up --config examples/codra-deploy/docker-nextjs/codra.deploy.json --dry-run
CODRA_DEPLOY_ENABLE_EXECUTE=1 codra deploy up --execute --service web --config examples/codra-deploy/docker-nextjs/codra.deploy.json
codra deploy logs --service web --config examples/codra-deploy/docker-nextjs/codra.deploy.json
```

## MVP Runtime Scope

- Dockerfile-based **web** and **worker** services
- Local Docker runner with safe command planning
- Env key redaction in output (values are never printed)
- Container labels: `codra.project`, `codra.service`
- Default container naming: `codra-<project>-<service>`

## Service Types

- **web** — executable via local Docker runner
- **worker** — executable via local Docker runner
- **static** — plan-only for now (skipped with warning)
- **cron** — plan-only for now (skipped with warning)

## Docker Config Fields

Optional per-service fields in `codra.deploy.json`:

| Field | Default | Description |
|-------|---------|-------------|
| `dockerfile` | `Dockerfile` | Dockerfile path relative to context |
| `context` | `root` or `.` | Docker build context |
| `image` | `codra-<project>-<service>:latest` | Image tag |
| `containerName` | `codra-<project>-<service>` | Container name (validated) |

## Safety

- Dry-run is default
- Real execution requires `CODRA_DEPLOY_ENABLE_EXECUTE=1` and `--execute`
- No destructive Docker cleanup in this MVP (no stop/rm/rmi)
- No rollback or update if a container already exists
- Env values are redacted; execution passes only env keys present in the process environment

## Not Yet Implemented

- Custom domains
- Databases
- Caddy routing
- Kubernetes
- Rollback / update of existing containers
- Destructive cleanup
- Static and cron runtime execution

## Future Roadmap

- Service lifecycle orchestration
- Log streaming
- Domain routing
- Runtime health reporting
- Database support
- Remote runner abstractions
- Post-deploy browser verification command:

```bash
codra deploy verify <url>
# or
codra browser check <url>
```