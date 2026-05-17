# Codra Roadmap

Codra is being developed as the local coding agent inside the Talocode ecosystem. The roadmap is organized into clear phases, with a strong focus on local-first principles and human supervision.

## Phase 1: Foundation

- [x] Native desktop shell (Tauri 2)
- [x] Local workspace selection
- [x] Project metadata loading
- [ ] Basic repo context and indexing
- [ ] Settings and local configuration
- [ ] Persistent workspace state

## Phase 2: Agent Loop

- [ ] Planner (architectural planning)
- [ ] Executor (precise file and command execution)
- [ ] Verifier (test and build verification)
- [ ] Repair loop (automatic failure recovery)
- [ ] Task history and audit trail
- [ ] Human approval checkpoints for all mutations

## Phase 3: Browser and Runtime Workflows

- [ ] Browser runtime via Chrome DevTools Protocol
- [ ] Local preview verification
- [ ] Deployment checks and smoke testing
- [ ] Screenshot and context capture (safe mode)
- [ ] Human takeover capability during browser sessions

## Phase 4: Talocode Integration

- [ ] Talocode control plane connection
- [ ] Mobile remote control
- [ ] Session streaming and status sync
- [ ] Remote task monitoring
- [ ] Permission and audit logs

## Phase 5: Team and Ecosystem

- [ ] Team workspaces
- [ ] Shared task history across devices
- [ ] Reusable agent workflows and templates
- [ ] Plugin and runtime extension system
- [ ] Marketplace or template ecosystem

---

**Current Focus**: Completing Phase 1 and beginning Phase 2 agent capabilities.

See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for technical details on how these phases will be implemented.