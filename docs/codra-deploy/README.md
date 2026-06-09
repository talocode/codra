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

## MVP Scope

- Project
- Service
- Deploy
- Environment variables
- Build command
- Start command
- Logs
- Domains
- Health checks

## Render-Style Service Types

- Web service
- Background worker
- Cron job
- Static site
- Database, later

## Future Roadmap

- Service lifecycle orchestration
- Log streaming
- Domain routing
- Runtime health reporting
- Database support
- Safe runner abstractions for local execution

## Non-Goals For This PR

- No Kubernetes
- No billing
- No hosted cloud
- No team management
- No destructive Docker operations
- No real domain provisioning yet
- No database add-ons yet
