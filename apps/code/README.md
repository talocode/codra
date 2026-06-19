# Codra Code

A local-first, open-source coding agent for real software work.

## Quickstart

### Install

```bash
npm install -g @talocode/codra-code
```

### Run in Test Mode (Mock)

```bash
codra-code --mock
```

### Run with OpenAI-Compatible Provider

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

- Real coding-agent workflow with provider execution
- Safe file editing with confirmation
- Git integration
- Command execution with safety checks
- Plugin execution
- Skills integration with prompts
- Session persistence
- File watching
- MCP support

## Test Mode (Mock)

Mock mode is for testing and development only. It uses simulated responses without making API calls.

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

### General
- `/help` - Show available commands
- `/status` - Show project, provider, model status
- `/doctor` - Check system health
- `/config` - Show current configuration
- `/clear` - Clear session view
- `/exit` - Quit Codra Code

### Provider
- `/model [name]` - Show or change current model
- `/provider [name]` - Show or change current provider

### File Editing
- `/read <path>` - Read a local file
- `/read <path> --context` - Add file to context
- `/write <path>` - Create/update a file (with confirmation)
- `/append <path>` - Append content to file
- `/patch <path>` - Apply patch to file
- `/diff <path>` - Show file diff
- `/pending` - Show pending edits
- `/apply` - Apply pending edits
- `/discard` - Discard pending edits

### Git
- `/git` - Show git summary
- `/git status` - Show git status
- `/git diff` - Show git diff
- `/git branch` - Show git branches
- `/git log` - Show recent commits
- `/git commit <msg>` - Commit changes

### Execution
- `/run <command>` - Run shell command (with confirmation)
- `/last` - Show last command result

### Skills & Plugins
- `/skills` - List installed skills
- `/skill <name>` - Activate a skill
- `/skill clear` - Clear active skill
- `/plugins` - List installed plugins
- `/plugin <name>` - Show plugin info
- `/plugin run <name>` - Run a plugin

### MCP
- `/mcp` - List MCP servers
- `/mcp status <name>` - Check server status
- `/mcp tools <name>` - List server tools
- `/mcp call <s> <t> <a>` - Call a tool

### Watching
- `/watch on` - Start file watching
- `/watch off` - Stop file watching
- `/watch status` - Show watch status

### Sessions
- `/sessions` - List saved sessions
- `/session` - Show current session info
- `/save` - Force save current session

## File Editing Workflow

1. Read a file: `/read src/index.ts`
2. Add to context: `/read src/index.ts --context`
3. Ask questions about the file
4. Propose changes via agent response
5. Apply changes: `/write` or `/append` or `/patch`
6. Review pending edits: `/pending`
7. Apply all: `/apply`
8. Or discard: `/discard`

## Git Integration

```bash
# Show git summary
/git

# Show status
/git status

# Show diff
/git diff

# Commit changes
/git commit "feat: add new feature"
```

## Plugin Execution

```bash
# List plugins
/plugins

# Run a plugin
/plugin run git-status
/plugin run project-summary
/plugin run test-runner
```

## Sessions

Sessions are automatically saved to `.codra/sessions/`:

- JSONL format for easy parsing
- Automatic secret redaction
- No data leaves your machine
- Full control over your data

## Safety

- Sensitive files (`.env`, `.npmrc`, private keys) are protected
- API keys never stored in session files
- Secrets redacted from logs
- Destructive commands blocked
- Confirmation prompts for file writes and command execution

## Non-Interactive Mode

```bash
# Execute a command
codra-code --mock "/status"

# Pipe input
echo "/status" | codra-code --mock

# With real provider
CODRA_PROVIDER=ollama CODRA_MODEL=llama3.1 codra-code "explain this project"
```

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

# Start in test mode
npm run mock

# Or start interactive mode
npm start
```

## License

MIT - See [LICENSE](./LICENSE) for details.

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) (MIT License).
