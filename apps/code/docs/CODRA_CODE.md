# Codra Code

## What is Codra Code?

Codra Code is a local-first, open-source coding agent interface designed for real software work. It provides a clean terminal experience for interacting with AI models while keeping your code and data local.

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
