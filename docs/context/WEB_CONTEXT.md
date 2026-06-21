# Codra Web Context

Using public documentation, releases, issues, and user-approved URLs as project context in Codra Code.

## Purpose

Codra Code can use web-sourced content as grounded context for planning, coding, debugging, and documentation tasks. This turns public docs and approved web pages into reliable, cited context that improves the quality of AI-generated output.

## When Web Context Helps

- Understanding a library or framework's API before using it
- Reading official documentation when debugging an error
- Referencing release notes when planning a migration
- Understanding a specification when implementing a standard
- Getting context from GitHub issues about known bugs
- Reading product docs when building integration features

## Context Sources

### Public Documentation

Official docs pages, API references, and guides from public websites.

### GitHub Content

Issues, releases, discussions, wikis, and README files from public repositories.

### Changelogs and Release Notes

Version history, breaking changes, and migration guides.

### Product Pages

Public product documentation, help centers, and knowledge bases.

### User-Provided URLs

Any URL the user explicitly asks Codra to read and use as context.

## Extraction Flow

```
User provides URL or task requires web context
  ↓
Fetch page content (HTTP GET or browser render)
  ↓
Extract clean markdown:
  - Main content area
  - Remove navigation/ads/boilerplate
  - Preserve code blocks and structure
  ↓
Attach metadata:
  - Source URL
  - Title
  - Fetched timestamp
  - Content type
  ↓
Store under .codra/context/web/
  ↓
Link to active plan/thread/session
  ↓
Inject into provider context (compressed if needed)
  ↓
Cite sources in generated output
```

## Storage

Web context is stored locally under the project's context directory:

```
.codra/context/web/
  ├── api-reference-abc123.json
  ├── release-notes-def456.json
  └── index.json
```

### Context Entry Format

```json
{
  "id": "ctx_abc123",
  "sourceUrl": "https://docs.example.com/api/v2",
  "title": "API Reference v2",
  "contentType": "documentation",
  "fetchedAt": "2026-06-21T10:00:00Z",
  "content": "clean markdown content...",
  "checksum": "sha256:...",
  "tags": ["api", "v2", "authentication"],
  "planIds": ["plan_xyz"],
  "threadIds": []
}
```

### index.json

Tracks all stored web context entries for fast lookup:

```json
{
  "entries": [
    {
      "id": "ctx_abc123",
      "title": "API Reference v2",
      "sourceUrl": "https://docs.example.com/api/v2",
      "fetchedAt": "2026-06-21T10:00:00Z",
      "sizeBytes": 4200
    }
  ],
  "lastRefreshed": "2026-06-21T12:00:00Z"
}
```

## Integration with Plans

When creating a plan that references web content:

1. Fetch relevant documentation
2. Store as web context entry
3. Link context ID to the plan
4. Plan steps can reference specific sections of the context
5. Validation steps can check output against source documentation

## Integration with Threads

Web context is available across thread turns:

1. Add web context at any point in a thread
2. All subsequent turns can reference it
3. Context is compressed to fit provider token limits
4. Stale context is flagged (older than 7 days)

## Provider Context Injection

When sending messages to the provider:

1. Check for active web context linked to current plan/thread
2. Compress context to fit within token budget
3. Inject as system context with source citations
4. Prioritize recently fetched context over stale content
5. Maximum 3 active web context entries per provider call

### Compression Rules

- Keep code examples verbatim
- Keep API signatures and parameter types verbatim
- Summarize prose sections to 1-2 sentences
- Keep error message patterns verbatim
- Remove promotional content and CTAs
- Keep maximum 8000 characters total per context entry

## Privacy and Safety

- Only fetch URLs the user explicitly provides or approves
- Never fetch private pages, dashboards, or authenticated content
- Never store credentials or session tokens from pages
- Respect robots.txt directives
- Default to session-scoped context (clearable with `/context clear`)
- Store web context under `.codra/` which is typically gitignored
- Do not commit web context to version control

## Future: CLI Commands

### /context add-url <url>

Fetch a URL and add it to the project's web context:

```
/context add-url https://docs.example.com/api/v2
```

### /context web search <query>

Search for relevant documentation and add matching pages:

```
/context web search "authentication refresh token"
```

### /context refresh <id>

Re-fetch a stored context entry to get updated content:

```
/context refresh ctx_abc123
```

### /context list

Show all active web context entries:

```
/context list
```

### /context remove <id>

Remove a stored context entry:

```
/context remove ctx_abc123
```

### /context clear

Remove all stored web context:

```
/context clear
```

## Future: Web Search Integration

When Codra supports web search:

1. User asks a question that requires web context
2. Codra searches for relevant public documentation
3. Fetches top results as web context
4. Uses context to answer with citations
5. Offers to save relevant results for later

## Token Budget

| Context Type | Max Characters | Priority |
|-------------|---------------|----------|
| Active plan context | 4000 | High |
| Web documentation | 8000 per entry | Medium |
| Web issues/releases | 4000 per entry | Medium |
| Compressed summaries | 2000 per entry | Low |

Total web context budget: 12000 characters per provider call.
