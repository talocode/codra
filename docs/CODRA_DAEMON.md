# Codra Local Daemon (v0.3)

## What is the Codra Daemon?

The Codra Daemon is a lightweight local HTTP + SSE server that exposes the full Codra Agent Task Loop over a localhost API.

It allows:
- The existing Tauri desktop UI to optionally become a client
- Talocode mobile (future) to control Codra remotely over a secure local network or relay

## Why it exists

- Codra is the local execution engine
- Talocode is the control plane
- We want a clean separation between the core agent and any UI client

## Local-first Security Model

- Binds only to 127.0.0.1 by default
- Refuses to bind to 0.0.0.0 unless a token is provided
- Optional `CODRA_DAEMON_TOKEN` for Authorization: Bearer header
- No public exposure by default

## Starting the daemon

```bash
cargo run -p codra-daemon -- --host 127.0.0.1 --port 4387
```

Environment variables:
- `CODRA_DAEMON_HOST`
- `CODRA_DAEMON_PORT`
- `CODRA_DAEMON_TOKEN`

## API Routes

### Health
`GET /health`

### Workspace
`GET /api/workspace/scan?path=...`

### Tasks
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `GET /api/tasks/:id/events`
- `GET /api/tasks/:id/events/stream` (SSE)

### Lifecycle
- `POST /api/tasks/:id/approve`
- `POST /api/tasks/:id/cancel`
- `POST /api/tasks/:id/execute`
- `POST /api/tasks/:id/verify`
- `POST /api/tasks/:id/repair/approve`

## Event Stream (SSE)

The `/events/stream` endpoint emits JSON TaskEvent objects every second when new events appear. This enables real-time progress for mobile clients.

## Limitations (MVP)

- No WebSocket yet (SSE only)
- No persistent token storage
- No rate limiting
- Real PTY execution still maturing in codra-core
- Desktop UI still uses direct Tauri commands

## Future

- Talocode relay support
- Authenticated mobile pairing
- Desktop UI can optionally connect to daemon instead of Tauri IPC