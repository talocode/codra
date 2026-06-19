# Codra Code

A local-first, open-source coding agent interface for real software work.

## Quickstart

### Install

```bash
npm install -g @talocode/codra-code
```

### Run in Mock Mode

```bash
codra-code --mock
```

### Run with OpenAI

```bash
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
codra-code start
```

### Run with Ollama

```bash
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start
```

## Features

- Terminal coding-agent interface with slash commands
- Provider-agnostic model layer (Mock, OpenAI, Ollama)
- Local-first project context
- File-context prompting
- Session persistence
- Skill discovery
- MCP integration
- Plugin discovery

## Mock Mode

Default mode when no API key is configured. Uses simulated responses for testing and development.

```bash
codra-code --mock
codra-code --mock "/status"
codra-code --mock "hello codra"
```

## Provider Setup

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

Sessions are automatically saved to `.codra/sessions/` in JSONL format:

- Each session contains timestamped entries
- API keys and secrets are redacted
- Use `/sessions` to list saved sessions
- Use `/session` to view current session info
- Use `/save` to force save the current session

## Local Session Storage

Codra Code stores sessions locally in `.codra/sessions/`:

- JSONL format for easy parsing
- Automatic secret redaction
- No data leaves your machine
- Full control over your data

## Safety

- Sensitive files (`.env`, `.npmrc`, private keys) are protected
- API keys are never stored in session files
- Secrets are redacted from logs
- Destructive actions require confirmation

## Development

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

## License

MIT - See [LICENSE](./LICENSE) for details.

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) (MIT License).
