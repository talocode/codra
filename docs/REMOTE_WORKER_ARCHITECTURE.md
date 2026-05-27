# Codra Remote Worker Architecture

## Inspiration: ESPHome Device Builder

ESPHome's remote-build offload system provides a proven pattern for pairing
weaker devices to strong remote builders. The architecture pairs a **Receiver**
(build server) with an **Offloader** (dashboard that delegates builds) over
Noise XX encrypted WebSocket, with mDNS discovery, OOB pin fingerprint
verification, and persistent peer-link sessions for job submission.

Codra adapts and extends this pattern for agent-task offloading — not firmware
compilation, but AI agent execution (file edits, command execution, search,
git operations) driven by a remote runtime.

---

## Codra Concepts

### Roles

| Role | Description | Analogous to |
|------|-------------|--------------|
| **Controller** | The user-facing instance that initiates tasks, receives events, and approves actions. Runs on a desktop, CLI, daemon, or Telegram/Android surface. | ESPHome Offloader |
| **Worker** | A headless instance that executes tasks. Runs on a build server, a powerful workstation in the LAN, or a cloud VM. Has no user-facing UI. | ESPHome Receiver (Build Server) |
| **Peer-link** | Encrypted persistent WebSocket session between Controller and Worker after successful pairing. | ESPHome peer-link session |

### Entities

| Entity | Description | State |
|--------|-------------|-------|
| **Runtime** | An adapter wrapping an execution system (Codra native, Codex SDK, CLI tool). A Worker hosts one Runtime. | Uninitialized → Ready → Busy → Degraded → Shutdown |
| **Session** | A conversation between a Controller and a Worker Runtime — user prompt + workspace context + task history. | Active → Paused → Completed / Cancelled / Failed |
| **Task** | A unit of work submitted to a Session. Produces a plan, executes steps, streams events back. | Draft → Planning → AwaitingApproval → Approved → Executing → Verifying → Completed / Failed / Cancelled |
| **Pairing Request** | A pending invitation from Controller to Worker to establish trust. | Pending → Approved / Rejected / Expired |
| **Pairing Fingerprint** | A human-comparable token derived from the Worker's X25519 static pubkey (SHA-256). Displayed as hex or emoji grid. | Immutable per keypair |
| **Worker Capability** | Declared abilities: max concurrent tasks, toolset, workspace paths, trust level. | Static per worker declaration |
| **Worker Status** | Live state of a paired Worker. | Offline / Idle / Busy / Degraded |
| **Remote Event Stream** | Live feed of RuntimeEvents pushed from Worker to Controller over peer-link. | Stream of RuntimeEvent |

### Trust Levels

| Level | Description | Permissions |
|-------|-------------|-------------|
| `Untrusted` | Not paired — can't submit tasks | None |
| `Limited` | Paired, read-only workspace access. No commands, no file writes. | `ReadFile`, `Search` |
| `Standard` | Full workspace access. Commands require approval. File writes require approval. | All tools, command approval required, file write approval required |
| `Elevated` | Trusted for autonomous work. Auto-approve low-risk commands (lint, test, build). | Pre-approved command patterns, auto-approve file writes in allowlisted paths |
| `Full` | Fully trusted. No approval gating. Only for personal LAN workers. | All operations auto-approved |

---

## Flows

### 1. Start Worker Daemon

```
Worker machine:
  $ codrad --mode worker --bind 0.0.0.0:9090

  Worker generates X25519 keypair on first start
  → persisted at ~/.codra/worker/identity.bin (0o600)
  → pin_sha256 = SHA-256(pubkey) advertised in mDNS TXT
  → Worker binds HTTP + WebSocket listener on worker-port
  → Heartbeat task starts, peer-link listener opens
```

### 2. Discover Worker

```
Controller discovers workers via:
  a) mDNS browse (_codra-worker._tcp.local) — automatic on same subnet
     TXT records: { pin_sha256, worker_port, worker_version, capabilities_hash }
  
  b) Manual add — user provides hostname:port
     Controller attempts Noise XX preview handshake to verify it's a real Worker
```

### 3. Create Pairing Request

```
Controller side:
  → User clicks "Pair" on discovered or manually added Worker
  
  Noise XX handshake (intent=preview):
    1. Controller sends Noise XX msg1 (ephemeral key)
    2. Worker responds msg2 (ephemeral + static pubkey)
    3. Controller sends msg3 (finish)
    4. WS closes — no application data exchanged
  
  → Controller computes pin_sha256 from Worker's static pubkey
  → Displays fingerprint to user
  
  Noise XX handshake (intent=pair_request):
    1. Fresh handshake (defeats TOCTOU)
    2. Payload: { controller_id, controller_label, trust_level_requested }
    3. Worker checks pairing window state
    4. Worker returns intent_response:
       - "pending" if pairing window open and no APPROVED row for this pubkey
       - "approved" if re-pairing against existing trust
       - "no_pairing_window" if window closed
```

### 4. Compare Fingerprint

```
Controller displays:   "Worker fingerprint: a3f1c8e2..."
Worker displays:       "Pairing request from: <controller_label>"
                       "Their fingerprint: a3f1c8e2..."

User compares them out-of-band (OOB):
  - Match: trust established, proceed to approve
  - Mismatch: abort — potential MITM or wrong worker
```

### 5. Approve Pairing

```
Worker side (pairing window must be open):
  → User clicks "Accept" on Worker's pairing screen
  → Worker persists StoredPeer { controller_id, pin_sha256, label, trusted_at }
  → Worker fires remote_worker_pair_status_changed { status: "approved" }
  
Controller side (long-poll over Noise WS with intent=pair_status):
  → Worker pushes intent_response: "approved"
  → Controller persists StoredPairing { worker_pin, worker_host, worker_port, paired_at }
  → Controller fires offloader_pair_status_changed { status: "approved" }
```

### 6. Persist Pairing

```
Controller: ~/.codra/pairings.json
  {
    "pairings": [
      {
        "pin_sha256": "a3f1c8e2...",
        "worker_host": "192.168.1.50",
        "worker_port": 9090,
        "label": "Build Server",
        "trust_level": "standard",
        "paired_at": "2026-01-15T10:30:00Z",
        "last_seen": "2026-01-15T11:00:00Z"
      }
    ]
  }

Worker: ~/.codra/worker/peers.json
  {
    "peers": [
      {
        "controller_id": "uuid-abc-123",
        "pin_sha256": "a3f1c8e2...",
        "label": "My Desktop",
        "trust_level": "standard",
        "trusted_at": "2026-01-15T10:30:00Z"
      }
    ]
  }
```

### 7. Route Task to Worker

```
Decision: pick_build_path(inputs) → Worker | Local

  Walk active pairings sorted by paired_at:
    Pass 1: First APPROVED + connected + idle Worker → route there
    Pass 2: First APPROVED + connected Worker (any queue state) → route there
    Fallback: Run locally (no remote workers available)

Establishment:
  1. Noise XX handshake (intent=peer_link)
     → Not gated by pairing window — approved peers connect anytime
  2. Worker registers peer-link session, starts heartbeat
  3. Controller sends submit_task { runtime_config, session_id, prompt }
```

### 8. Stream Logs/Events Back

```
Over the peer-link WS, Worker pushes RuntimeEvent items:

  Event flow:
    task_created        → Controller shows "Task submitted"
    task_planning       → Controller shows "Worker is planning..."
    task_plan_ready     → Controller shows plan summary
    task_action_pending → Controller requests user approval
    task_log            → Controller streams stdout/stderr
    task_completed      → Controller shows result summary

All events ride the same peer-link WS — no polling, no secondary connection.
Controller forwards events to its local RuntimeEvent stream for UI consumption.
```

### 9. Approve Risky Actions from Controller

```
When Worker encounters a PendingAction (file write, command, deploy):

  Worker → peer-link WS → RuntimeEvent { kind: TaskActionPending, payload: { ... } }
  
  Controller receives event:
    → Forwards to UI (desktop, CLI prompt, Telegram approve/reject buttons)
    → User approves or rejects
  
  Controller → peer-link WS → approve_action { request_id, approved, reason }
  Worker receives approval → executes or skips action
```

### 10. Collect Result / Diff / PR Link

```
Task completes on Worker:

  Worker sends task_completed event with:
    - success: bool
    - summary: string
    - changed_files: [{ path, change_type, diff }]
    - commands_run: [{ command, exit_code, stdout_preview, stderr_preview }]
    - git_changes: { branch, commit_hash, pr_link }
  
  Controller receives, persists locally, surfaces in UI.
  If git_push was part of task, Worker returns the PR link.
```

---

## Safety Model

### Workspace Allowlist

```
Worker config: ~/.codra/worker/config.toml
  [workspaces]
  allowed = ["/home/user/projects/*", "/data/code/*"]
  blocked = ["/home/user/projects/secret"]
  read_only = ["/data/reference/*"]
```

### Command Approval

```
Worker enforces:
  - CommandPolicy: allowed_commands globs, denied_commands globs
  - Every command execution goes through safety check before running
  - Dangerous patterns blocked at Worker level regardless of trust level:
    • rm -rf /, sudo without allowlist, curl | bash, git push --force
    • Sensitive env var exposure (API_KEY, TOKEN, SECRET, PASSWORD)
```

### Secret Redaction

```
Worker redacts from logs and events:
  - Protected env keys (case-insensitive prefix match)
  - API keys, tokens, passwords in command arguments
  - File content containing secrets (future: pattern-based scanning)

Controller never receives raw secrets — only redacted event payloads.
```

### No Arbitrary Filesystem Access

```
Worker defaults:
  - All file operations confined to allowed workspace paths
  - Path traversal detection on every file read/write
  - .codra/ directory is internal — never touched by remote tasks
  - Blocked paths override allowed paths when both match
```

### Human Approval Before Edits/Commands

```
By default (trust_level=standard):
  - WriteFile, EditFile → require approval
  - RunCommand → require approval
  - InstallDependency → require approval
  - Deploy, ComputerUse → require approval + risk warning
  - ReadFile, Search → auto-approved (no network round-trip needed)

Approval travels: Worker → peer-link → Controller → user → Controller → peer-link → Worker
```

### Worker Trust Levels

See [Trust Levels table](#trust-levels) above.

### Revocation

```
Controller side:
  → User unpairs a Worker
  → Controller deletes StoredPairing from pairings.json
  → Controller sends terminate { reason: "revoked" } over active peer-link
  → Worker deletes StoredPeer from peers.json
  → Both sides forget trust

Worker side:
  → Admin deletes peer from Worker's peers.json
  → Worker terminates active session if connected
  → Controller sees peer-link close, marks Worker as "untrusted"

Identity rotation:
  → Worker rotates X25519 keypair via --rotate-identity
  → New pin_sha256 invalidates all existing pairings
  → Every Controller must re-pair
  → Equivalent to "compromise recovery" — one rotation revokes all trust
```

---

## Transport Layer

### Current: Local Daemon API

```
codra-daemon already provides:
  - REST HTTP API at localhost:4387
  - SSE event streaming
  - Bearer token auth
  - CRUD for tasks

This is the local-only baseline. Remote transport builds on top.
```

### Phase 1: WebSocket Event Stream (peer-link)

```
Noise XX encrypted WebSocket for remote transport:
  - Separate port from REST API (default 9091 for worker)
  - Single long-lived session per paired Controller-Worker pair
  - Encrypted heartbeat every 30s, timeout after 90s
  - Application frames: submit_task, approve, reject, cancel, RuntimeEvent push
  - Binary frames for file content, compressed bundles

Protocol:
  Every frame: { "type": <string>, "seq": <u64>, "payload": <json> }
  Responses:   { "type": "response", "seq": <u64>, "ok": true, "result": <json> }
  Errors:      { "type": "response", "seq": <u64>, "ok": false, "error": <string> }
  Events:      { "type": "event", "kind": <string>, "payload": <json> }
  Heartbeat:   { "type": "ping", "nonce": <u64> } / { "type": "pong", "nonce": <u64> }
```

### Phase 2: mDNS Discovery

```
Type: _codra-worker._tcp.local
TXT records:
  pin_sha256       — lowercase hex SHA-256 of X25519 static pubkey
  worker_port      — the peer-link WS port
  worker_version   — semver version
  worker_name      — human-readable label
  capabilities     — comma-separated list: "runtime,file,session"
  trust_required   — minimum trust level this worker accepts: "standard"

Worker advertises on startup. Controller browses on its discovery screen.
HA add-on workers skip mDNS by default (Docker IP not LAN-routable).
```

### Phase 3: Manual Worker URL

```
Users on different subnets or without mDNS:

  Controller provides: codra://worker-hostname:9091/pin_sha256
  Controller attempts direct TCP + Noise XX handshake.
  Pin comparison still works OOB — user compares display fingerprints.
```

### Phase 4: Telegram/Android Controller Support

```
Telegram bot and Android app act as thin controllers:
  - Cannot host a runtime — delegate to a paired Worker
  - Can approve/reject actions
  - Can view task status and logs
  - Can initiate new tasks from templates
  
  Flow: Telegram → HTTPS → codra-daemon (REST) → peer-link → Worker
  
  The daemon becomes the gateway: it holds pairings, routes approvals,
  and streams events to multiple controller surfaces simultaneously.
```

---

## MVP Implementation Slices

### Slice 0: Doc + Types Only (THIS DOCUMENT)

- Remote worker concepts defined
- Types sketched but not committed

### Slice 1: Local Daemon Health Endpoint

```
Add to codra-daemon: GET /api/workers/health

  Returns the daemon's own worker-mode status — ready to accept
  pairings, runtime loaded, workspace configured.
  
  This is the seed endpoint that a remote Controller could probe
  to discover the daemon's worker capabilities.
```

**Files:**
- `crates/codra-daemon/src/main.rs` — add `/api/workers/health` route
- `crates/codra-daemon/src/state.rs` — add `WorkerState` to `DaemonState`

### Slice 2: Manual Worker Registration Types

```
Add Rust types to codra-runtime:
  struct WorkerIdentity { pub X25519 keypair + pin_sha256 derivation }
  struct StoredPeer { controller_id, pin_sha256, label, trust_level, trusted_at }
  struct StoredPairing { worker_pin, worker_host, worker_port, label, trust_level, paired_at }
  enum WorkerStatus { Offline, Idle, Busy, Degraded }
  enum TrustLevel { Untrusted, Limited, Standard, Elevated, Full }

Also:
  struct WorkerCapabilities { max_concurrent_tasks, tools, trust_levels_accepted }
  struct PairingRequest { controller_id, label, trust_level_requested }
  struct PairingFingerprint { pin_sha256, displayed_as }
```

**Files:**
- `crates/codra-runtime/src/types.rs` — add worker types
- `crates/codra-runtime/src/lib.rs` — re-export new types
- `crates/codra-runtime/Cargo.toml` — add `x25519-dalek`, `sha2` deps (optional, gated by `worker` feature)

### Slice 3: Pairing Token/Fingerprint

```
Add pairing logic (no network yet):
  fn generate_worker_identity() -> WorkerIdentity
  fn derive_pin_sha256(pubkey: &[u8]) -> String
  fn verify_fingerprint(identity: &WorkerIdentity, claimed_pin: &str) -> bool
  fn create_pairing_request(controller_id, label, trust_level) -> PairingRequest
  fn approve_pairing(peer: &mut StoredPeer) -> Result<()>
  fn revoke_pairing(peer: &mut StoredPeer) -> Result<()>
```

**Files:**
- `crates/codra-runtime/src/worker.rs` — worker identity + pairing functions
- `crates/codra-runtime/src/lib.rs` — add worker module

### Slice 4: Remote Task Submit Stub

```
Add to CodraRuntime trait:
  async fn submit_to_worker(&self, task: SubmitTaskRequest, worker: WorkerId) -> RuntimeResult<RuntimeTask>
  async fn get_worker_status(&self, worker: WorkerId) -> RuntimeResult<WorkerStatus>

Implement stub:
  - Accepts a WorkerId, returns a completed stub task
  - No real network transport — validates types and flow
  - Tests verify the stub route works end-to-end
```

**Files:**
- `crates/codra-runtime/src/traits.rs` — add remote task methods
- `crates/codra-runtime/src/registry.rs` — add worker registry
- `crates/codra-runtime/src/stub.rs` — implement stub methods

### Slice 5: Event Stream Forwarding

```
Add peer-link types for event streaming:
  struct PeerLinkFrame { seq, type, payload }
  struct PeerLinkSession { worker_id, session, heartbeat_task }
  
  fn open_peer_link(config: PeerLinkConfig) -> PeerLinkSession
  fn send_event(session: &PeerLinkSession, event: RuntimeEvent)
  fn receive_events(session: &PeerLinkSession) -> EventStream
  fn close_peer_link(session: &PeerLinkSession)
```

**Files:**
- `crates/codra-runtime/src/peer_link.rs` — peer-link session abstraction
- `crates/codra-runtime/src/lib.rs` — add peer_link module

### Slice 6: Runtime Execution on Worker

```
The Worker runs an instance of the NativeCodraRuntime:
  - Worker process initializes with its own config
  - Accepts remote session creation from paired Controllers
  - Executes tasks via the existing task lifecycle
  - Streams RuntimeEvents back over peer-link
  - Enforces safety config from Worker's own config file
```

**Files:**
- `crates/codra-daemon/src/main.rs` — add `--mode worker` flag
- `crates/codra-daemon/src/worker.rs` — worker-mode main loop
- Integrates with `codra-runtime-native` for actual execution

---

## Integration with Existing Systems

### codra-runtime

```
The existing CodraRuntime trait + RuntimeRegistry are the foundation.
Remote-aware extensions:

  Registry gets a worker registration path:
    registry.add_worker(worker_id, peer_link_config) -> WorkerHandle
  
  CodraRuntime trait gets two new method groups:
    - Worker management: list_workers, get_worker_status, pair/unpair
    - Remote task routing: submit_to_worker, stream_events_from_worker
  
  These are additive — existing local runtimes don't need changes.
  The RuntimeCapabilities struct gets a new field: supports_remote_workers
```

### Codex SDK Runtime (Future)

```
The future Codex SDK runtime adapter runs on the Worker:
  - Controller pairs to Worker
  - Controller submits task to Worker
  - Worker creates a Codex SDK session via its own adapter
  - Worker maps Codex events back to RuntimeEvents
  - Worker forwards approval requests to Controller

The Codex SDK itself never knows it's being accessed remotely —
the Worker wraps it like any other CodraRuntime adapter.
```

### CLI/TUI

```
CLI gains:
  codra worker start          — start worker daemon
  codra worker discover       — mDNS browse for workers
  codra worker pair <host>    — initiate pairing
  codra worker list           — list paired workers
  codra worker status <id>    — get worker status
  codra task submit --worker <id>  — route task to worker
  
  Session attach streams events whether local or remote.
```

### Desktop

```
Desktop gains in Settings → "Workers" panel:
  - Discovered workers list (mDNS)
  - Paired workers list with status indicators
  - Pair/Unpair/Re-pair buttons
  - Trust level selector
  - Worker capability display

Runtime picker adds a "Submit to Worker" option alongside local runtimes.
Event stream in the task pane shows "(remote)" badge for remote execution.
```

### Telegram/Android Control Layer

```
Telegram bot and Android app are thin controllers:
  - Authenticate to codra-daemon (REST API)
  - View paired workers and their status
  - See pending approval requests
  - Approve/reject via buttons
  - View task summaries

The daemon is the gateway — it holds pairings, routes approvals,
and fans out events to all connected control surfaces.

  ┌──────────┐     ┌──────────────┐     ┌──────────┐
  │ Telegram │────▶│ codra-daemon │◀───▶│ Worker 1 │
  │ Bot      │     │              │     ├──────────┤
  └──────────┘     │  Pairings    │     │ Worker 2 │
                   │  Registry    │     ├──────────┤
  ┌──────────┐     │  Event Bus   │     │ Worker 3 │
  │ Android  │────▶│  Auth        │     └──────────┘
  │ App      │     └──────────────┘
  └──────────┘
```

---

## Architecture Diagram

```
                           ┌──────────────────────────┐
                           │     CONTROL SURFACES      │
                           │                           │
              ┌────────────┼─────┬──────────┬─────────┤
              │            │     │          │         │
         ┌────▼───┐  ┌────▼──┐ ┌▼──────┐ ┌─▼──────┐  │
         │Desktop  │  │CLI/TUI│ │Telegram│ │Android │  │
         │(Tauri)  │  │       │ │Bot    │ │App     │  │
         └────┬────┘  └───┬───┘ └───┬───┘ └───┬────┘  │
              │           │         │         │       │
              └───────────┼─────────┼─────────┘       │
                          │         │                  │
                     ┌────▼─────────▼──────────┐      │
                     │     codra-daemon         │      │
                     │  (gateway + controller)  │      │
                     │                         │      │
                     │  ┌───────────────────┐  │      │
                     │  │  RuntimeRegistry  │  │      │
                     │  │  + Pairings       │  │      │
                     │  │  + Worker Routes  │  │      │
                     │  └────────┬──────────┘  │      │
                     └───────────┼─────────────┘      │
                                 │                    │
           ┌─────────────────────┼────────────────┐    │
           │           Peer-link │ Noise XX       │    │
           │                     │                │    │
     ┌─────▼──────┐       ┌─────▼──────┐         │    │
     │  Worker 1  │       │  Worker 2  │         │    │
     │  (LAN)     │       │  (Cloud)   │         │    │
     │            │       │            │         │    │
     │ NativeRT   │       │ CodexSDK   │         │    │
     │ codra-core │       │ Adapter    │         │    │
     └────────────┘       └────────────┘         │    │
                                                  │    │
        LOCAL EXECUTION            REMOTE         │    │
        (same process)          EXECUTION         │    │
        ┌──────────────┐       (paired workers)   │    │
        │ Local Worker │                          │    │
        │ (no peer)    │                          └────┘
        └──────────────┘
```

---

## Relationship to ESPHome Device Builder

| ESPHome Concept | Codra Equivalent | Notes |
|-----------------|------------------|-------|
| Dashboard | Controller (Desktop/CLI/Daemon) | The user-facing surface |
| Build Server | Worker | The execution backend |
| Offloader | Controller routing tasks to worker | Delegates work |
| Noise XX handshake | Noise XX handshake | Same protocol, same threat model |
| Pin fingerprint | Pin fingerprint | Same SHA-256 of X25519 pubkey |
| mDNS `_esphomebuilder._tcp` | mDNS `_codra-worker._tcp` | Same discovery pattern |
| Pairing window | Pairing window | Same window-gated accept |
| PENDING (RAM-only) | PENDING (RAM-only) | Same bounded-inbox pattern |
| StoredPeer / StoredPairing | StoredPeer / StoredPairing | Same persistence shape |
| Submit job + artifacts | Submit task + workspace bundle | Different payload (config bundle vs workspace context) |
| `pick_build_path` | `pick_worker_path` | Same local-or-remote decision |
| Firmware job queue | Task queue | Worker-local task queue |
| Heartbeat | Heartbeat | Same keepalive pattern |
| Receiver compiles, offloader installs | Worker executes, controller collects results | Same "work happens remotely" |
| `download_artifacts` | Stream result/diff/PR back | Same result return pattern |

---

## Threat Model

| Threat | Mitigation |
|--------|------------|
| LAN MITM during first pair | OOB pin verification defeats MITM on first contact |
| Replay pairing request | Fresh Noise XX handshake each time — ephemeral keys |
| Impersonate approved worker | Pin derived from static pubkey — impersonation changes pin |
| Malicious LAN scanner fills pairing inbox | PENDING is RAM-only, bounded by pairing window lifetime |
| Unauthorized task submission | Peer-link session requires APPROVED pairing + Noise handshake |
| Escalate trust level | Trust level is part of pairing contract — verified on every peer-link |
| Access files outside workspace | Worker enforces workspace allowlist on every operation |
| Execute dangerous commands | Worker enforces command allowlist + danger pattern detection |
| Leak secrets via logs | Worker redacts protected env keys and patterns from all events |
| Worker compromise | Rotate identity key → all pairings invalidated |
| Controller compromise | Worker unpairs controller → revokes trust unilaterally |
| Replay captured Noise frames | Key agreement provides forward secrecy via ephemeral keys |
| DNS rebind attack | mDNS pin matching verifies identity independently of hostname |

---

## Worker Mode Daemon Configuration

```toml
# ~/.codra/worker/config.toml

[worker]
enabled = true
bind_host = "0.0.0.0"
bind_port = 9091
name = "Build Server Alpha"
version = "0.1.0"
trust_required = "standard"    # minimum trust level this worker accepts
max_concurrent_tasks = 2

[worker.identity]
# Auto-generated on first start, stored at:
# ~/.codra/worker/identity.bin (0o600)
# key_type = "x25519"

[worker.workspaces]
allowed = ["/home/user/projects/*", "/data/code/*"]
blocked = []
read_only = ["/data/reference/*"]

[worker.commands]
allowed = ["*"]
denied = ["rm -rf /*", "sudo*", "curl * | bash", "git push --force"]
require_approval = ["*"]

[worker.secrets]
protected_env_keys = ["API_KEY", "TOKEN", "SECRET", "PASSWORD", "CODRA_*"]
redact_in_logs = true

[worker.network]
heartbeat_interval_seconds = 30
heartbeat_timeout_seconds = 90
max_payload_bytes = 16777216  # 16 MB
```

---

## Next Steps After This Document

1. **Slice 0** — review and merge this document
2. **Slice 1** — add `/api/workers/health` to codra-daemon (gateway groundwork)
3. **Slice 2** — add worker types to `codra-runtime/src/types.rs` (WorkerIdentity, StoredPeer, StoredPairing, TrustLevel, WorkerStatus)
4. **Slice 3** — implement pairing functions in `codra-runtime/src/worker.rs` (generate identity, derive pin, verify fingerprint)
5. **Slice 4** — add `submit_to_worker` stub to CodraRuntime trait + registry
6. **Slice 5** — create peer-link session abstraction (authenticated frame types, send/receive, heartbeat)
7. **Slice 6** — add `--mode worker` to codra-daemon, wire NativeCodraRuntime behind peer-link
8. **Integration** — CLI `codra worker` subcommands, Desktop Workers panel, Telegram approval bot
