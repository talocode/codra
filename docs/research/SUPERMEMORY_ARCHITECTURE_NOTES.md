# Supermemory Architecture Research Notes

Research date: 2026-06-11  
Reference: [supermemoryai/supermemory](https://github.com/supermemoryai/supermemory)  
Docs: [supermemory.ai/docs](https://supermemory.ai/docs/intro)  
Codra repo: `/root/projects/codra`  
Method: Public documentation + API reference inspection. **No Supermemory source was copied into Codra. No Supermemory dependency added.**

---

## What Supermemory Is

Supermemory is a **memory and context engine for AI agents** — not a chat-history store. It positions itself as infrastructure for long-term and short-term agent context: persistent memory, managed RAG, user profiles, connectors, file processing, and a local/self-hosted mode with the same API shape as the hosted platform.

### Core capabilities (summarized)

| Capability | What it does |
|------------|--------------|
| **Memory and context engine** | Ingests text, conversations, files, and URLs; extracts facts; builds a semantic knowledge graph over entities (users, projects, documents). At query time, returns only relevant context. |
| **Persistent user/project memory** | Memories are stateful, temporal, and relational — they evolve, update, extend, and derive from prior facts. Contradictions are resolved; expired facts are forgotten. |
| **RAG + memory** | Documents (raw knowledge) and memories (extracted, entity-centric facts) share a context pool but serve different roles. Hybrid search (`searchMode: "hybrid"`) returns both memory facts and document chunks. |
| **User profiles** | Automatically maintained `profile.static` (long-term facts) and `profile.dynamic` (recent episodic context). Built from ingested content — no manual profile setup. |
| **Connectors** | OAuth/sync integrations: Google Drive, Gmail, Notion, OneDrive, GitHub, Granola, Web Crawler, S3. Documents flow through extraction → chunking → embedding → indexing. |
| **Local/self-hosted option** | Single binary (`npx supermemory local` or `supermemory-server`). Embedded graph engine, local embeddings, generated API key, full Memory API at `http://localhost:6767`. Same SDK with `baseURL` change. Runs fully offline with Ollama/LM Studio/vLLM. |

### API surface (observed)

Supermemory exposes a layered API rather than a single "save chat" endpoint:

| Operation | Endpoint / method | Purpose |
|-----------|-------------------|---------|
| **Add** | `POST /v3/documents`, `client.add()` | Ingest raw content; pipeline extracts memories |
| **Search / Recall** | `POST /v4/search`, `client.search.memories()` | Hybrid semantic search over memories + chunks |
| **Profile** | `POST /v4/profile`, `client.profile()` | `static` + `dynamic` profile; optional `q` adds `searchResults` |
| **Forget** | `POST /v4/memories/{id}/forget` | Soft-delete; excluded from search, preserved in history |
| **Direct memory CRUD** | `POST/PATCH /v4/memories` | Create/update memories without document pipeline |
| **Connectors** | `POST /v3/connections/{provider}` | OAuth + sync external sources into container tags |

### Memory graph behavior (high level)

From a single conversation, Supermemory extracts multiple connected facts with three relationship types:

- **Updates** — new fact contradicts old (e.g. job change); `isLatest` tracks current truth
- **Extends** — new fact enriches without replacing
- **Derives** — inferred facts from patterns

Automatic forgetting handles time-bound facts ("exam tomorrow"), contradiction resolution, and noise filtering. Developers do not manually tag relationships or clean up stale entries.

### Self-hosted vs hosted

| Feature | Self-hosted | Hosted platform |
|---------|-------------|---------------|
| Full Memory API | ✅ | ✅ |
| Hybrid search | ✅ | ✅ |
| Local embeddings | ✅ | Managed |
| File ingestion | ✅ | ✅ |
| Connectors | — | ✅ |
| MCP server | — | ✅ |
| Memory extraction quality | Your LLM/key | Proprietary long-horizon models |

**Architectural lesson:** Local-first with identical API shape; upgrade path is a `baseURL` change, not a rewrite.

---

## Files Read (Supermemory + Codra)

### Supermemory (public docs only)

| Source | What we learned |
|--------|-----------------|
| [docs/intro](https://supermemory.ai/docs/intro) | Product positioning; memory API + profiles + RAG as unified context stack |
| [docs/user-profiles](https://supermemory.ai/docs/user-profiles) | `profile.static` / `profile.dynamic`; profile + search in one call via `q` |
| [docs/search](https://supermemory.ai/docs/search) | Hybrid search modes, threshold, rerank, metadata filters |
| [docs/add-memories](https://supermemory.ai/docs/add-memories) | Ingestion pipeline, `customId`, `containerTag`, `entityContext` |
| [docs/concepts/filtering](https://supermemory.ai/docs/concepts/filtering) | Container tags for isolation; metadata AND/OR filters |
| [docs/concepts/graph-memory](https://supermemory.ai/docs/concepts/graph-memory) | Update/extend/derive relationships; automatic forgetting |
| [docs/concepts/memory-vs-rag](https://supermemory.ai/docs/concepts/memory-vs-rag) | Documents vs memories; why RAG alone fails for agent memory |
| [docs/memory-operations](https://supermemory.ai/docs/memory-operations) | Direct memory create, versioned update, forget |
| [docs/connectors/overview](https://supermemory.ai/docs/connectors/overview) | OAuth connectors, sync mechanisms, GitHub webhook sync |
| [docs/self-hosting/overview](https://supermemory.ai/docs/self-hosting/overview) | Local binary, offline mode, drop-in SDK `baseURL` |
| [docs/supermemory-mcp/mcp](https://supermemory.ai/docs/supermemory-mcp/mcp) | MCP tools: `memory`, `recall`, `whoAmI`; `/context` prompt |
| [docs/integrations/claude-code](https://supermemory.ai/docs/integrations/claude-code) | Coding-agent plugin: session-start injection + auto-capture of tool usage |

**Not read:** Supermemory source code (per task constraint). GitHub README fetch failed; docs site was primary source.

### Codra (alignment baseline)

| File | Relevance |
|------|-----------|
| `AGENTS.md` | `.codra` workspace rules; task JSON is source of truth |
| `docs/ARCHITECTURE.md` | `codra-memory` planned; `.codra/tasks/*.json` implemented |
| `docs/research/MIMOCODE_ARCHITECTURE_NOTES.md` | Four-layer markdown memory layout; budgeted injection |
| `docs/research/MIMO_LONG_HORIZON_AGENT_LOOP.md` | Startup context, checkpoint, memory PR sequence |
| `docs/RUNTIME_ADAPTER_ARCHITECTURE.md` | `MemoryStore` trait stub in `codra-memory` |
| `crates/codra-memory/src/lib.rs` | Minimal `MemoryStore`: `init`, `store_context`, `get_context` |
| `docs/PLAN.md` | Long-term memory direction |

---

## Patterns Codra Should Learn

### 1. Memory as API, not chat history

**Supermemory pattern:** Memory is an infrastructure layer exposed through `add`, `search`, `profile`, `forget` — not a transcript dump. Chat is one ingestion source; durable state lives in extracted facts and structured documents.

**Codra implication:** CLI and core should eventually expose:

```
codra memory add
codra memory recall
codra memory profile
codra memory context
codra memory forget
```

Task JSON (`.codra/tasks/*.json`) remains machine source of truth for lifecycle state. Memory API is a **projection + retrieval layer** over markdown files, task events, and (optionally) external providers — never raw chat alone.

### 2. Project-scoped memory

**Supermemory pattern:** `containerTag` isolates memory spaces. Recommended patterns: `user_{id}`, `project_{id}`, hierarchical `org_{id}_team_{id}`. Exact array matching on multi-tag memories.

**Codra container tags (proposed):**

```
user:abdulmuiz
project:codra
project:launchpix
project:tradia
project:tera
project:agent-browser
task:<task-id>          # optional fine scope
```

This prevents TradiaAI trading context from polluting Codra Deploy work. Local provider maps tags to filesystem paths under `~/.codra/projects/` and `{workspace}/.codra/`.

### 3. User profile + relevant search in one call

**Supermemory pattern:** `client.profile({ containerTag, q })` returns:

```json
{
  "profile": { "static": [...], "dynamic": [...] },
  "searchResults": { "results": [...], "total": N }
}
```

**Codra startup questions this answers in one call:**

- Who is the developer?
- What is Talocode / this project?
- What recent work matters?
- What memories are relevant to this task?

Maps directly to `MemoryProvider.context()` — see design below.

### 4. Hybrid search over docs + memories

**Supermemory pattern:** `searchMode: "hybrid"` searches extracted memories **and** document chunks. Results carry either `memory` or `chunk` field. Threshold + optional rerank control precision.

**Codra adaptation (phased):**

| Phase | Implementation |
|-------|----------------|
| v0 (local) | Ripgrep/BM25 over `.codra/**/*.md` + `AGENTS.md` + `CODRA.md` |
| v1 | SQLite FTS5 in `codra-memory` (aligned with MiMo-Code notes) |
| v2 | Optional `SupermemoryProvider` hybrid search via API |

Never inject full files — rank, threshold, and budget per section (see MiMo budget pattern).

### 5. Local-first memory engine

**Supermemory pattern:** `npx supermemory local` → API at `localhost:6767`, data local, same SDK. No hosted dependency for basic operation.

**Codra pattern (proposed):**

```
LocalMarkdownMemoryProvider   # default, zero config
SupermemoryProvider           # optional, SUPERMEMORY_API_KEY + baseURL
PostgresMemoryProvider        # future hosted Talocode plane
```

Configuration in `.codra/config.toml` or `~/.codra/config.toml`:

```toml
[memory]
provider = "local"   # local | supermemory | postgres

[memory.supermemory]
base_url = "http://localhost:6767"   # or https://api.supermemory.ai
api_key_env = "SUPERMEMORY_API_KEY"
```

Basic Codra operation must work with **no API keys and no network**.

### 6. Connector-based memory ingestion

**Supermemory pattern:** Connectors sync external sources (GitHub, Drive, Notion, Gmail, etc.) into container-tagged document pools. Webhook + scheduled sync. GitHub syncs documentation files from repos.

**Codra first connector (recommended): GitHub**

| Source | Container tag | Use |
|--------|---------------|-----|
| Issues / PRs | `project:{repo}` | Task context, review history |
| Commits | `project:{repo}` | Recent change awareness |
| `AGENTS.md`, `docs/` | `project:{repo}` | Architecture rules |
| CI failure logs | `project:{repo}` | Debug memory |

**Phased approach:**

1. **Local connector** — `codra memory ingest --git-log`, `codra memory ingest --pr <n>` (reads via `codra-tools` git layer; no OAuth)
2. **Supermemory connector** — delegate to hosted GitHub connector when `SupermemoryProvider` is configured
3. **Talocode connector plane** — future unified connector registry for TeraAI, LaunchPix, TradiaAI

### 7. MCP/plugin approach for coding agents

**Supermemory pattern:** MCP server exposes `memory` (save/forget), `recall` (search + profile), `whoAmI`, and a `/context` prompt for session-start injection. Claude Code / OpenCode plugins auto-capture tool usage (Edit, Write, Bash, Task) and inject memories on session start.

**Codra adaptation:**

| Surface | Tools |
|---------|-------|
| `codra mcp-server` (existing) | Add `codra_memory_add`, `codra_memory_recall`, `codra_memory_context` |
| Session hook | `codra memory context --task <id>` at agent loop start |
| Auto-capture | On task events (`executed`, `verified`, `failed`) → append to `tasks/<id>/progress.md` and optionally `memory add` |

Codra advantage: approval-gated writes — auto-capture proposes memories; user can reject before durable merge (unlike blind chat logging).

---

## Codra Memory Design

### Decision: provider abstraction (A + B + C)

| Option | Verdict |
|--------|---------|
| A. Supermemory as external provider | ✅ Supported as `SupermemoryProvider` |
| B. Codra-native memory layer | ✅ Default `LocalMarkdownMemoryProvider` |
| C. Provider abstraction | ✅ **Recommended architecture** |

Do not integrate Supermemory everywhere yet. Start local-first; add Supermemory as optional provider behind the same trait.

### `MemoryProvider` interface (proposed)

Replace/extend the minimal `MemoryStore` trait in `codra-memory` with a richer provider contract:

```rust
// crates/codra-memory/src/provider.rs (proposed — not implemented in this doc)

pub struct MemoryScope {
    pub user_id: Option<String>,       // e.g. "abdulmuiz"
    pub project_id: Option<String>,    // e.g. "codra"
    pub task_id: Option<String>,
    pub workspace_root: PathBuf,
}

pub struct MemoryAddInput {
    pub content: String,
    pub scope: MemoryScope,
    pub metadata: HashMap<String, String>,
    pub custom_id: Option<String>,     // dedup / update key
    pub is_static: bool,               // maps to profile.static candidate
}

pub struct MemoryRecord {
    pub id: String,
    pub content: String,
    pub scope: MemoryScope,
    pub metadata: HashMap<String, String>,
    pub created_at: DateTime<Utc>,
    pub source: MemorySource,          // local_md | supermemory | task_event | connector
}

pub struct MemorySearchResult {
    pub id: String,
    pub content: String,
    pub similarity: f32,               // 0.0–1.0; 1.0 for exact file match in local v1
    pub source: MemorySource,
    pub metadata: HashMap<String, String>,
}

pub struct UserProjectProfile {
    pub static_facts: Vec<String>,
    pub dynamic_facts: Vec<String>,
}

pub struct MemoryContextBundle {
    pub profile: UserProjectProfile,
    pub search_results: Vec<MemorySearchResult>,
    pub files_injected: Vec<InjectedFile>,  // AGENTS.md, MEMORY.md sections, etc.
    pub token_budget_used: u32,
}

pub struct MemoryContextQuery {
    pub scope: MemoryScope,
    pub query: Option<String>,
    pub threshold: f32,                // default 0.6
    pub limit: usize,                  // default 10
    pub include_profile: bool,         // default true
}

pub trait MemoryProvider: Send + Sync {
    fn add(&self, input: MemoryAddInput) -> Result<MemoryRecord, MemoryError>;
    fn recall(&self, query: &str, scope: &MemoryScope) -> Result<Vec<MemorySearchResult>, MemoryError>;
    fn profile(&self, scope: &MemoryScope) -> Result<UserProjectProfile, MemoryError>;
    fn forget(&self, id: &str) -> Result<(), MemoryError>;
    fn context(&self, query: MemoryContextQuery) -> Result<MemoryContextBundle, MemoryError>;
}
```

TypeScript mirror in `packages/shared` for CLI/MCP/desktop IPC boundaries.

### Providers

#### `LocalMarkdownMemoryProvider` (default)

- Reads/writes markdown under `.codra/` and `~/.codra/`
- `profile.static` ← `~/.codra/USER.md` + stable sections of `~/.codra/MEMORY.md`
- `profile.dynamic` ← `checkpoint.md` + recent `tasks/<id>/progress.md` head + `notes.md`
- `recall` ← ripgrep/FTS over scoped paths; BM25 ranking when FTS available
- `add` ← append to `notes.md` or structured section in `MEMORY.md` with frontmatter id
- `forget` ← move entry to `.codra/memory/.forgotten/` or strike through with tombstone metadata
- No network, no API keys

#### `SupermemoryProvider` (optional)

- Implements same trait via Supermemory HTTP API (`/v3/documents`, `/v4/search`, `/v4/profile`, `/v4/memories/.../forget`)
- Maps `MemoryScope` → `containerTag` (e.g. `project:codra`)
- Enabled only when `SUPERMEMORY_API_KEY` (or local key) is set
- `baseURL` configurable for self-hosted `localhost:6767`

#### `PostgresMemoryProvider` (future)

- Talocode hosted memory plane
- Same trait; vector + FTS in Postgres/pgvector
- Team workspace sync, audit logging
- Not required for local-first Codra operation

---

## Codra Memory Layout

### Workspace-local (`.codra/`)

```
{workspace}/.codra/
  MEMORY.md              # durable project facts, architecture decisions
  checkpoint.md          # current session resume snapshot
  notes.md               # scratch working notes
  history/               # session JSONL traces (fallback, not primary memory)
    session-<id>.jsonl
  tasks/
    <task-id>/
      progress.md        # append-only execution log
      plan.md            # approved plan snapshot
      decisions.md       # design decisions with rationale
    <task-id>.json       # (existing) machine source of truth
    events/
      <task-id>.jsonl    # (existing) event stream
  memory/                # (optional) indexed memory entries with frontmatter
    entries/
      <id>.md
    .forgotten/          # tombstoned entries
```

### Global (`~/.codra/`)

```
~/.codra/
  USER.md                # developer identity, preferences, stable facts
  MEMORY.md              # cross-project durable facts
  config.toml            # provider selection, budgets, connector config
  projects/
    codra/
      MEMORY.md          # project-specific global notes (when not in repo)
    launchpix/
      MEMORY.md
    tera/
      MEMORY.md
```

**Note:** `/root/USER.md` and `/root/MEMORY.md` (user's agent workspace convention) are the v0 of `~/.codra/USER.md` and `~/.codra/MEMORY.md`. Migration path: Codra reads both locations with `~/.codra/` taking precedence.

### Relationship to task JSON

| Layer | Role | Writer |
|-------|------|--------|
| `.codra/tasks/*.json` | Machine source of truth for lifecycle | `codra-core` TaskStore |
| `.codra/tasks/events/*.jsonl` | Append-only event stream | `codra-core` |
| Markdown memory files | Human/agent-readable projections | `codra-core` on state transitions |
| `MemoryProvider` | Retrieval + context bundling | `codra-memory` |

JSON leads; markdown follows. Never the reverse.

---

## Startup Context Flow

When Codra agent loop starts (or `codra memory context` runs):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Read ~/.codra/USER.md (or /root/USER.md fallback)        │
│    → profile.static (user preferences, identity)            │
├─────────────────────────────────────────────────────────────┤
│ 2. Read ~/.codra/MEMORY.md (or /root/MEMORY.md fallback)    │
│    → profile.static (cross-project facts)                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Read {workspace}/AGENTS.md + CODRA.md                    │
│    → project rules, agent constraints                       │
├─────────────────────────────────────────────────────────────┤
│ 4. Read {workspace}/.codra/MEMORY.md                        │
│    → profile.static (project facts)                         │
├─────────────────────────────────────────────────────────────┤
│ 5. Recall relevant project/task memories                    │
│    → scope: user + project + active task                    │
│    → query: task goal or user message                       │
│    → threshold-filtered hybrid search                       │
├─────────────────────────────────────────────────────────────┤
│ 6. Build MemoryContextBundle for agent                      │
│    → profile.static + profile.dynamic + searchResults       │
│    → budget-capped sections (never full dump)               │
│    → inject into system prompt / planner context            │
└─────────────────────────────────────────────────────────────┘
```

**Dynamic profile sources at step 6:**

- `.codra/checkpoint.md`
- `.codra/tasks/<active-task>/progress.md` (last N lines)
- `.codra/notes.md`
- Recent task events summary from JSONL

**Budget defaults (proposed, align with MiMo notes):**

```toml
[memory.budget]
user_md = 2000
global_memory_md = 3000
project_memory_md = 4000
checkpoint_md = 3000
progress_md = 2000
search_results = 3000
total_context = 12000
```

---

## Talocode Ecosystem Fit

Supermemory's model applies beyond Codra:

| Product | Memory use | Container tag |
|---------|------------|---------------|
| **Codra** | Architecture, task state, PR history, deploy knowledge, debug history | `project:codra` |
| **TeraAI** | Learner profile, topics mastered/struggling, explanation style, study goals | `project:tera` |
| **LaunchPix** | Brand tone, product description, colors, past assets, CTA style, audience | `project:launchpix` |
| **TradiaAI** | Risk habits, setups, bad patterns, journal reflections, market conditions | `project:tradia` |

Shared `user:{id}` profile across products; project tags prevent cross-product pollution.

---

## Must-Never Rules (Codra)

1. **Never** depend only on chat history for durable memory.
2. **Never** inject all memory blindly — always scoped, ranked, and budget-capped.
3. **Never** scope memory globally when task/project scope is known.
4. **Never** require hosted memory or API keys for basic local operation.
5. **Never** store secrets, API keys, tokens, or credentials in memory files or provider entries.
6. **Never** copy Supermemory source code or import Supermemory before explicit integration PR.
7. **Never** let markdown projections become lifecycle source of truth over task JSON.
8. **Never** auto-write `AGENTS.md` or project rules from memory extraction without user approval.

---

## Recommended First Implementation PR

**PR title:** `feat(memory): add local memory provider interface`

**Why this is the safest first step:**

1. Aligns with existing `.codra/` workspace model and MiMo research roadmap.
2. Provider trait enables future Supermemory/Postgres without rework.
3. No external API dependency — pure Rust + filesystem.
4. Unblocks agent loop context injection and MCP tools.
5. Testable without network or API keys.

### Scope

| In scope | Out of scope |
|----------|--------------|
| `MemoryProvider` trait + types in `codra-memory` | Supermemory HTTP client |
| `LocalMarkdownMemoryProvider` implementation | SQLite FTS / embeddings |
| Unit + integration tests (temp dirs, scope guards) | Auto-capture from chat |
| CLI: `codra memory context [--task <id>] [--json]` | GitHub connector |
| CLI: `codra memory status` (list memory files) | Postgres provider |
| Docs update in `docs/ARCHITECTURE.md` | Desktop UI memory panel |

### Deliverables checklist

- [ ] `crates/codra-memory/src/provider.rs` — trait + types
- [ ] `crates/codra-memory/src/local.rs` — `LocalMarkdownMemoryProvider`
- [ ] `crates/codra-memory/src/scope.rs` — container tag → path resolution
- [ ] `crates/codra-memory/src/budget.rs` — token budget enforcement
- [ ] `crates/codra-cli/src/memory.rs` — `context`, `status` subcommands
- [ ] Tests: workspace boundary, no writes outside `.codra/`, budget caps, empty profile fallback
- [ ] `docs/ARCHITECTURE.md` — memory provider section

### Follow-on PRs (sequence)

| PR | Name | Depends on |
|----|------|------------|
| 2 | `feat(memory): add recall and add CLI commands` | PR 1 |
| 3 | `feat(memory): agent loop context injection` | PR 1, task loop |
| 4 | `feat(memory): SQLite FTS local search` | PR 1 |
| 5 | `feat(memory): supermemory provider` | PR 1, API key config |
| 6 | `feat(memory): github connector (local git ingest)` | PR 2, `codra-tools` git |
| 7 | `feat(memory): mcp memory tools` | PR 1–3 |

---

## What Codra Should NOT Copy

| Category | Reason |
|----------|--------|
| Supermemory source code | Task constraint; Rust-native implementation required |
| Proprietary graph extraction pipeline | Requires hosted LLM; local v1 uses explicit markdown + optional FTS |
| Hosted-only connectors in v1 | Local-first; git ingest first |
| Unbounded auto-capture | Codra requires approval for durable rule changes |
| Chat-as-memory | Explicitly forbidden |
| `~/.codra-agent/` SQLite path alone | Superseded by provider abstraction; SQLite becomes one backend |

---

## Codra vs Supermemory (Gap Analysis)

| Capability | Supermemory | Codra today | After roadmap |
|------------|-------------|-------------|---------------|
| Memory API | Full REST v3/v4 | `MemoryStore` stub (3 methods) | `MemoryProvider` trait |
| User profiles | Auto-extracted static/dynamic | None | Local markdown + optional Supermemory |
| Hybrid search | Embeddings + chunks | None | FTS v1 → optional Supermemory |
| Graph memory | Automatic update/extend/derive | None | Manual versioning in markdown v1; graph later |
| Connectors | 7+ OAuth integrations | None | Local git ingest → Supermemory delegate |
| MCP | Hosted MCP server | `codra mcp-server` (minimal) | Memory tools added |
| Local/self-hosted | Single binary | `.codra/` markdown (planned) | `LocalMarkdownMemoryProvider` |
| Project scoping | `containerTag` | `.codra/` per workspace | Container tags in provider |
| Approval gate | N/A | **Codra advantage** | Keep for memory writes to rules |

---

## Relation to Prior Research

This document complements [MIMOCODE_ARCHITECTURE_NOTES.md](./MIMOCODE_ARCHITECTURE_NOTES.md) and [MIMO_LONG_HORIZON_AGENT_LOOP.md](./MIMO_LONG_HORIZON_AGENT_LOOP.md):

- **MiMo-Code** teaches filesystem memory layout, checkpointing, and budgeted injection.
- **Supermemory** teaches memory-as-API, profile+search unification, provider abstraction, connectors, and hybrid retrieval semantics.
- **Codra synthesis:** Local markdown provider first (MiMo layout) behind a Supermemory-shaped API (provider trait), with optional `SupermemoryProvider` for teams that want managed graph memory.

---

## Next Step

**Implement PR 1:** `feat(memory): add local memory provider interface` — trait, local provider, tests, `codra memory context`. No Supermemory dependency.