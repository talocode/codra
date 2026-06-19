# Codra Code

A local-first, open-source coding agent interface for real software work.

## Features

- Terminal coding-agent interface with slash commands
- Provider-agnostic model layer (Mock, OpenAI, Ollama)
- Local-first project context
- File-context prompting
- Session persistence
- Skill discovery
- MCP integration
- Plugin discovery

## Installation

```bash
npm install -g @talocode/codra-code
```

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run in mock mode
npm run mock
```

## Usage

```bash
# Start interactive mode
codra-code start

# Run in mock mode
codra-code --mock

# Execute a command non-interactively
codra-code --mock "/status"

# Pipe input
echo "/status" | codra-code --mock
```

## Configuration

Codra Code uses environment variables for configuration:

- `CODRA_PROVIDER` - Model provider (mock, openai, ollama)
- `CODRA_MODEL` - Model name
- `CODRA_API_KEY` - API key for the provider
- `CODRA_BASE_URL` - Custom base URL for API

### Mock Mode

Default mode when no API key is configured. Uses simulated responses for testing.

```bash
export CODRA_PROVIDER=mock
codra-code start
```

### OpenAI-Compatible Provider

```bash
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
codra-code start
```

### Ollama Provider

```bash
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start
```

## Commands

- `/help` - Show available commands
- `/status` - Show project and configuration status
- `/model [name]` - Show or change current model
- `/provider [name]` - Show or change current provider
- `/config` - Show current configuration
- `/skills` - List installed skills
- `/skill <name>` - Open or activate a skill
- `/mcp` - List MCP servers
- `/plugins` - List installed plugins
- `/files` - Inspect project file tree
- `/read <path>` - Read a local file
- `/read <path> --context` - Add file to context
- `/write <path>` - Create/update a file
- `/run <command>` - Run shell command
- `/sessions` - List saved sessions
- `/session` - Show current session info
- `/save` - Force save current session
- `/clear` - Clear session view
- `/exit` - Quit Codra Code

## Sessions

Sessions are automatically saved to `.codra/sessions/` in JSONL format.

- Each session contains timestamped entries
- API keys and secrets are redacted
- Use `/sessions` to list saved sessions
- Use `/session` to view current session info

## File Context

Read files and add them to the conversation context:

```bash
# Read a file
/read src/index.ts

# Add file to context
/read src/index.ts --context

# Ask questions about the file
What does this file do?
```

## Safety

- Sensitive files (`.env`, `.npmrc`, private keys) are protected
- API keys are never stored in session files
- Secrets are redacted from logs
- Destructive actions require confirmation

## License

MIT - See [LICENSE](./LICENSE) for details.

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) (MIT License).
