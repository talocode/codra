# Codra Code

## What is Codra Code?

Codra Code is a local-first, open-source coding agent interface designed for real software work. It provides a clean terminal experience for interacting with AI models while keeping your code and data local.

## Codra Code Terminal Composer

When launched interactively, `codra-code` shows a clean centered terminal composer:

```
                          codra-code

        Local-first coding agent by Talocode

┌──────────────────────────────────────────────────────────────┐
│ Ask Codra to build, fix, review, test, or understand code... │
└──────────────────────────────────────────────────────────────┘

Build · <provider>/<model> · <mode> · confirm-edits

/ commands    tab autocomplete    @ attach file soon    ctrl+c exit

/workspace/projects/codra:main
v0.2.3
```

### Elements

| Element | Description | Example |
|---|---|---|
| Title | Brand name "codra-code" centered and bold | `codra-code` |
| Subtitle | "Local-first coding agent by Talocode" | shown on wide terminals |
| Prompt box | Box with placeholder for user input | `Ask Codra to build, fix...` |
| Status row | Build · provider/model · mode · edit-policy | `Build · xai/grok-3 · hosted · confirm-edits` |
| Shortcuts | Available interactive commands | `/ commands tab autocomplete @ attach file soon ctrl+c exit` |
| Footer | Workspace path:git-branch and version | `/workspace/projects/codra:main v0.2.3` |

### Commands

- `/` — Open command picker menu
- `/help` — Show available commands
- `/status` — Show configuration and project status
- `/model` — Manage model selection
- `/provider` — Manage provider selection
- `/auth` — Show authentication status
- `/login` — Sign in with Tera/Talocode account
- `/logout` — Sign out
- `/clear` — Clear session view
- `/exit` — Quit

### Shortcuts

- `/ commands` — Type `/` to open picker
- `tab autocomplete` — Tab key for autocomplete
- `@ attach file soon` — File attachment (coming soon)
- `ctrl+c exit` — Exit the session

### Local vs Hosted Behavior

**Local mode** (mock, ollama):
- No login required
- All slash commands work
- Chat with local models

**Hosted mode** (openai, gemini, anthropic, xai):
- Requires `codra login` with Tera account
- If not authenticated, shows: "Sign in with your Tera/Talocode account to use hosted Codra Code."
- `/login` starts device auth flow

### Login Limitation

The Tera device auth backend may not be deployed yet.
If the endpoint returns HTML, Codra Code shows a clean message:

```
Login failed: Tera auth endpoint was not found.
Codra Code expected a JSON auth response from:
https://teraai.chat/api/codra/auth/device/start
This means the Tera/Codra device auth backend is not deployed yet.
Local mode still works:
  codra-code --mock /status
```

No raw HTML, tokens, or secrets are ever printed.

## Why Codra Code?

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code), Codra Code takes the concept of a terminal-based coding agent and adapts it for the Codra ecosystem with a focus on:

- **Local-first**: Your code stays on your machine
- **Provider-agnostic**: Use any AI model provider
- **Extensible**: Skills, plugins, and MCP integration
- **Safe**: Confirmation for destructive actions, secret protection

## License

Codra Code is released under the MIT License.

This project was inspired by MiMo-Code, which is also MIT licensed. We acknowledge and thank the MiMo-Code team for their work.

## Local-First Principle

Codra Code operates on the principle that your code and data should remain local by default:

- Files are only read when explicitly requested
- No automatic uploads of project files
- API keys are stored in environment variables
- Session data stays local in `.codra/sessions/`

## Provider-Agnostic Model Layer

Codra Code supports multiple AI model providers:

### Mock Provider

Default mode when no API key is configured. Uses simulated responses for testing and development.

```bash
export CODRA_PROVIDER=mock
codra-code start
```

### OpenAI-Compatible Provider

Works with OpenAI and any OpenAI-compatible API (Azure, etc.).

```bash
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
codra-code start
```

### Ollama Provider

Connect to a local Ollama instance.

```bash
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start
```

### Configuration

Configure via environment variables:

- `CODRA_PROVIDER` - Provider name (mock, openai, ollama)
- `CODRA_MODEL` - Model name
- `CODRA_API_KEY` - API key for the provider
- `CODRA_BASE_URL` - Custom base URL for API

## Skills Layer

Skills are reusable instruction sets that can be loaded into your session:

- Located in `apps/code/skills/`, `.codra/skills/`, or `~/.codra/skills/`
- Each skill has a `SKILL.md` file
- Use `/skills` to list and `/skill <name>` to activate

## MCP Layer

Model Context Protocol (MCP) integration allows connecting to external tools:

- Configuration in `.codra/mcp.json` or `~/.codra/mcp.json`
- Use `/mcp` to list configured servers
- See [MCP documentation](https://modelcontextprotocol.io/) for details

## Plugin Layer

Plugins extend Codra Code with additional functionality:

- Located in `apps/code/plugins/`, `.codra/plugins/`, or `~/.codra/plugins/`
- Each plugin has a `plugin.json` manifest
- Use `/plugins` to list installed plugins

## File-Context Prompting

Read files and add them to the conversation context:

```bash
# Read a file
/read src/index.ts

# Add file to context
/read src/index.ts --context

# Ask questions about the file
What does this file do?
```

Files added to context are included in subsequent prompts to the AI model.

## Session Persistence

Sessions are automatically saved to `.codra/sessions/` in JSONL format:

- Each session contains timestamped entries
- API keys and secrets are redacted
- Use `/sessions` to list saved sessions
- Use `/session` to view current session info
- Use `/save` to force save the current session

## Slash Commands

Codra Code provides a comprehensive set of slash commands:

- `/help` - Show available commands
- `/status` - Show configuration and project status
- `/model` - Manage model selection
- `/provider` - Manage provider selection
- `/config` - Show current configuration
- `/skills` - Skill management
- `/mcp` - MCP server management
- `/plugins` - Plugin management
- `/files` - File tree inspection
- `/read` - File reading with context support
- `/write` - File writing (with confirmation)
- `/run` - Command execution (with confirmation)
- `/sessions` - List saved sessions
- `/session` - Show current session info
- `/save` - Force save session
- `/clear` - Clear session view
- `/exit` - Quit

## Safety Model

Codra Code includes safety features:

- Sensitive file protection (`.env`, `.npmrc`, private keys)
- API keys never stored in session files
- Secrets redacted from logs
- Confirmation prompts for file writes
- Confirmation prompts for command execution
- Respects `.gitignore`

## Non-Interactive Mode

Codra Code supports non-interactive execution:

```bash
# Execute a command
codra-code --mock "/status"

# Pipe input
echo "/status" | codra-code --mock

# Agent response
codra-code --mock "hello codra"
```

## How to Run Locally

```bash
# Clone the repository
git clone https://github.com/talocode/codra.git
cd codra

# Install dependencies
pnpm install

# Navigate to code app
cd apps/code

# Install app dependencies
npm install

# Start in mock mode
npm run mock

# Or start interactive mode
npm start
```

## Support Talocode

Talocode builds open-source workflow layers for builders: coding agents, learning tools, trading intelligence, video workflows, and local-first automation.

If Codra Code helps you, you can support the work here:

[![Sponsor Abdulmuiz44](https://img.shields.io/badge/Sponsor-Abdulmuiz44-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Abdulmuiz44)

## Roadmap

- [ ] Real-time file watching
- [ ] Git integration
- [ ] Multi-file editing
- [ ] Terminal multiplexing
- [ ] Voice input
- [ ] Custom themes
- [ ] Plugin marketplace
- [ ] MCP transport layer
- [ ] Plugin execution with sandboxing

## v0.4: Auth + Slash Command Interface

### Authentication Gate
- Hosted usage now requires Tera/Talocode account via `codra login`
- Local providers (mock, ollama) remain available without login
- Clear messaging: "Sign in with your Tera/Talocode account to use hosted Codra Code."
- `codra auth status` shows account, hosted availability

### Slash Command Menu
- Type `/` in interactive `codra code` REPL to open interactive picker
- Supports: /help /model /provider /auth /login /logout /status /project /files /plan /build /review /test /commit /clear /exit
- Placeholder commands show helpful "not wired yet" messages

### Model/Provider Picker
- `/model` launches full interactive picker:
  - Lists providers with local/hosted/auth notes
  - Then lists models for selected provider
  - Persists via saveConfig to ~/.codra/config.json
- Current model/provider shown in header

### Terminal Header (start of `codra code`)
```
Codra Code
Workspace: /path
Mode: local/hosted
Auth: signed in as user@teraai.chat / not signed in
Provider: ...
Model: ...
Context: X files
Commands: type / for commands
```

### /status Enhancements
- Git branch
- Auth status + email
- Config paths (project + user)
- Slash commands count
- Mode, provider, model, provider availability

### Safe Practices
- Never prints access/refresh tokens
- Uses safe metadata only
- Dev bypass via env vars only

See docs/AUTH.md for full auth details.
