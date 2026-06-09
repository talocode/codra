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