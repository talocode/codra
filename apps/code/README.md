# Codra Code

A local-first, open-source coding agent for real software work.

[![npm version](https://img.shields.io/npm/v/@talocode/codra-code.svg)](https://www.npmjs.com/package/@talocode/codra-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Download

### From GitHub Release

Download the latest release from [GitHub Releases](https://github.com/talocode/codra/releases/latest).

#### Linux

```bash
# Download and extract
tar -xzf codra-code-v0.1.4-linux-x64.tar.gz
cd codra-code-v0.1.4-linux-x64

# Run
./bin/codra-code --version
./bin/codra-code --help
./bin/codra-code --mock "/status"
```

#### Windows

```powershell
# Download and extract
Expand-Archive codra-code-v0.1.4-windows-x64.zip
cd codra-code-v0.1.4-windows-x64

# Run
.\bin\codra-code.cmd --version
.\bin\codra-code.cmd --help
.\bin\codra-code.cmd --mock "/status"
```

#### macOS

```bash
# Download and extract
tar -xzf codra-code-v0.1.4-macos-arm64.tar.gz
cd codra-code-v0.1.4-macos-arm64

# Run
./bin/codra-code --version
./bin/codra-code --help
./bin/codra-code --mock "/status"
```

**Note:** Portable releases require Node.js >= 18.0.0 installed on your system.

### From npm

```bash
# Install globally
npm install -g @talocode/codra-code

# Or use npx (no install required)
npx @talocode/codra-code --mock "/status"
```

## Quick Start

### Run in test mode (no API key needed)

```bash
codra-code --mock
```

### Run with Ollama (Recommended for local-first)

```bash
# Install Ollama: https://ollama.ai
# Pull a model: ollama pull llama3.1

export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
codra-code start
```

### Run with OpenAI-Compatible API

```bash
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
codra-code start
```

## Features

### Real Coding-Agent Workflow

- **File Editing**: Safe file editing with confirmation
- **Git Integration**: Status, diff, branch, log, commit
- **Command Execution**: Run commands with safety checks
- **Plugin Execution**: Built-in plugins for common tasks
- **MCP Support**: Connect to MCP servers for extended tools
- **Skills**: Activate skills that influence agent behavior
- **Sessions**: Persistent conversation history

### Slash Commands

#### General
- `/help` - Show available commands
- `/status` - Show project and provider status
- `/doctor` - Check system health
- `/config` - Show current configuration

#### File Editing
- `/read <path>` - Read a file
- `/read <path> --context` - Add file to context
- `/write <path>` - Write file (with confirmation)
- `/append <path>` - Append to file
- `/patch <path>` - Apply patch
- `/diff <path>` - Show file diff
- `/pending` - Show pending edits
- `/apply` - Apply pending edits
- `/discard` - Discard pending edits

#### Git
- `/git` - Git summary
- `/git status` - Git status
- `/git diff` - Git diff
- `/git branch` - Git branches
- `/git log` - Recent commits
- `/git commit <msg>` - Commit changes

#### Execution
- `/run <command>` - Run command (with confirmation)
- `/last` - Show last command result

#### Skills & Plugins
- `/skills` - List skills
- `/skill <name>` - Activate skill
- `/plugins` - List plugins
- `/plugin run <name>` - Run plugin

#### MCP
- `/mcp` - List MCP servers
- `/mcp connect <name>` - Connect to server
- `/mcp tools <name>` - List tools
- `/mcp call <server> <tool>` - Call tool

#### Watching
- `/watch on` - Start file watching
- `/watch off` - Stop watching

### Non-Interactive Mode

```bash
# Execute a command
codra-code --mock "/status"

# Pipe input
echo "/status" | codra-code --mock

# With real provider
CODRA_PROVIDER=ollama codra-code "explain this project"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODRA_PROVIDER` | Provider name (mock, openai, ollama) | mock |
| `CODRA_MODEL` | Model name | gpt-4o-mini |
| `CODRA_API_KEY` | API key for provider | - |
| `CODRA_BASE_URL` | Custom API base URL | - |

### Config Files

- Project config: `.codra/config.json`
- User config: `~/.codra/config.json`
- MCP config: `.codra/mcp.json`

## Safety

- Sensitive files (`.env`, `.npmrc`, private keys) are protected
- API keys never stored in session files
- Secrets redacted from logs
- Dangerous commands blocked
- Confirmation prompts for file writes and command execution

## Sessions

Sessions are automatically saved to `.codra/sessions/`:

- JSONL format for easy parsing
- Automatic secret redaction
- No data leaves your machine
- Full control over your data

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

# Package release artifacts
npm run package:release
```

## License

MIT - See [LICENSE](./LICENSE) for details.

Inspired by [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) (MIT License).
