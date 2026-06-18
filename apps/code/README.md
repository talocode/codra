# Codra Code

A local-first, open-source coding agent interface for real software work.

## Features

- Terminal coding-agent interface
- Local-first project context
- Provider-agnostic model layer
- Slash-command system
- Skill discovery
- MCP integration
- Plugin system

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
```

## Usage

```bash
# Start Codra Code
codra-code start

# Or directly via npm
npm start
```

## Configuration

Codra Code uses environment variables for configuration:

- `CODRA_PROVIDER` - Model provider (openai, anthropic, ollama, custom)
- `CODRA_MODEL` - Model name
- `CODRA_API_KEY` - API key for the provider
- `CODRA_BASE_URL` - Custom base URL for API

## Commands

- `/help` - Show available commands
- `/status` - Show project and configuration status
- `/model [name]` - Show or change current model
- `/provider [name]` - Show or change current provider
- `/skills` - List installed skills
- `/mcp` - List MCP servers
- `/plugins` - List installed plugins
- `/files` - Inspect project file tree
- `/read <path>` - Read a local file
- `/write <path>` - Create/update a file
- `/run <command>` - Run shell command
- `/clear` - Clear session
- `/exit` - Quit Codra Code

## License

MIT - See [LICENSE](./LICENSE) for details.

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) (MIT License).
