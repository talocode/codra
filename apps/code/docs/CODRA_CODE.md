# Codra Code

## What is Codra Code?

Codra Code is a local-first, open-source coding agent interface designed for real software work. It provides a clean terminal experience for interacting with AI models while keeping your code and data local.

## Why Codra Code?

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code), Codra Code takes the concept of a terminal-based coding agent and adapts it for the Codra ecosystem with a focus on:

- **Local-first**: Your code stays on your machine
- **Provider-agnostic**: Use any AI model provider
- **Extensible**: Skills, plugins, and MCP integration
- **Safe**: Confirmation for destructive actions

## License

Codra Code is released under the MIT License.

This project was inspired by MiMo-Code, which is also MIT licensed. We acknowledge and thank the MiMo-Code team for their work.

## Local-First Principle

Codra Code operates on the principle that your code and data should remain local by default:

- Files are only read when explicitly requested
- No automatic uploads of project files
- API keys are stored in environment variables
- Session data stays local

## Provider-Agnostic Model Layer

Codra Code supports multiple AI model providers:

- OpenAI-compatible APIs
- Anthropic-compatible APIs
- Local/Ollama-compatible APIs
- Custom base URLs

Configure via environment variables:

```bash
export CODRA_PROVIDER=openai
export CODRA_MODEL=gpt-4
export CODRA_API_KEY=your-key-here
```

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

## Slash Commands

Codra Code provides a comprehensive set of slash commands:

- `/help` - Show available commands
- `/status` - Show configuration and project status
- `/model` - Manage model selection
- `/provider` - Manage provider selection
- `/skills` - Skill management
- `/mcp` - MCP server management
- `/plugins` - Plugin management
- `/files` - File tree inspection
- `/read` - File reading
- `/write` - File writing (with confirmation)
- `/run` - Command execution (with confirmation)
- `/clear` - Clear session
- `/exit` - Quit

## Safety Model

Codra Code includes safety features:

- Confirmation prompts for file writes
- Confirmation prompts for command execution
- Respects `.gitignore`
- No secrets in project config
- Environment variables for API keys

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

# Start development mode
npm run dev
```

## Roadmap

- [ ] Full agent response integration
- [ ] Real-time file watching
- [ ] Git integration
- [ ] Multi-file editing
- [ ] Terminal multiplexing
- [ ] Voice input
- [ ] Custom themes
- [ ] Plugin marketplace
