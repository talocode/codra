# Codra Code

A local-first, open-source coding agent for real software work.

[![npm version](https://img.shields.io/npm/v/@talocode/codra-code.svg)](https://www.npmjs.com/package/@talocode/codra-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Download

### From npm (Recommended)

```bash
npm install -g @talocode/codra-code
```

### From GitHub Release

Download the latest release from [GitHub Releases](https://github.com/talocode/codra/releases/latest).

#### Linux

```bash
tar -xzf codra-code-v0.1.6-linux-x64.tar.gz
cd codra-code-v0.1.6-linux-x64
./bin/codra-code --version
```

#### Windows

```powershell
Expand-Archive codra-code-v0.1.6-windows-x64.zip
cd codra-code-v0.1.6-windows-x64
.\bin\codra-code.cmd --version
```

#### macOS

```bash
tar -xzf codra-code-v0.1.6-macos-arm64.tar.gz
cd codra-code-v0.1.6-macos-arm64
./bin/codra-code --version
```

**Note:** Portable releases require Node.js >= 18.0.0.

## Authentication

Codra Code requires a Tera account for authentication.

### Login

```bash
codra-code login
```

This will:
1. Open your browser to Tera sign-in page
2. Authenticate with your Tera account
3. Store credentials locally at `~/.codra/auth.json`

### Headless Login

For SSH or headless environments:

```bash
codra-code login --no-browser
```

This prints a URL you can open manually.

### Auth Status

```bash
codra-code auth status
```

### Logout

```bash
codra-code logout
```

### Local Development

For testing with a local Tera server:

```bash
CODRA_AUTH_BASE_URL=http://localhost:3099 codra-code login --no-browser
```

## Quick Start

### Run in test mode (no API key needed)

```bash
codra-code --mock
```

### Run with Ollama (Recommended for local-first)

```bash
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

- **Tera authentication** - Secure account-based access
- **Real provider execution** - OpenAI-compatible, Ollama, and mock providers
- **Safe file editing** - Write, append, and patch files with confirmation
- **Git integration** - Status, diff, branch, log, commit
- **Plugin execution** - Built-in plugins for common tasks
- **MCP server support** - Connect to MCP servers for extended tools
- **Skills system** - Activate skills that influence agent behavior
- **Session persistence** - Conversation history saved locally
- **Non-interactive mode** - Execute commands from scripts

## Slash Commands

### Authentication
- `/login` - Authenticate with Tera account
- `/logout` - Sign out
- `/auth` - Show authentication status

### General
- `/help` - Show available commands
- `/status` - Show project and provider status
- `/doctor` - Check system health
- `/config` - Show current configuration

### File Editing
- `/read <path>` - Read a file
- `/read <path> --context` - Add file to context
- `/write <path>` - Write file (with confirmation)
- `/append <path>` - Append to file
- `/patch <path>` - Apply patch
- `/diff <path>` - Show file diff
- `/pending` - Show pending edits
- `/apply` - Apply pending edits
- `/discard` - Discard pending edits

### Git
- `/git` - Git summary
- `/git status` - Git status
- `/git diff` - Git diff
- `/git branch` - Git branches
- `/git log` - Recent commits
- `/git commit <msg>` - Commit changes

### Execution
- `/run <command>` - Run command (with confirmation)
- `/last` - Show last command result

### Skills & Plugins
- `/skills` - List skills
- `/skill <name>` - Activate skill
- `/plugins` - List plugins
- `/plugin run <name>` - Run plugin

### MCP
- `/mcp` - List MCP servers
- `/mcp connect <name>` - Connect to server
- `/mcp tools <name>` - List tools
- `/mcp call <server> <tool>` - Call tool

### Watching
- `/watch on` - Start file watching
- `/watch off` - Stop watching

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODRA_PROVIDER` | Provider name (mock, openai, ollama) | mock |
| `CODRA_MODEL` | Model name | gpt-4o-mini |
| `CODRA_API_KEY` | API key for provider | - |
| `CODRA_BASE_URL` | Custom API base URL | - |
| `CODRA_AUTH_BASE_URL` | Tera auth URL for local dev | https://teraai.chat |
| `CODRA_AUTH_DEV_BYPASS` | Dev auth bypass (1 to enable) | - |

### Config Files

- Project config: `.codra/config.json`
- User config: `~/.codra/config.json`
- Auth token: `~/.codra/auth.json`
- MCP config: `.codra/mcp.json`

## Security

- Tera authentication required for protected commands
- Token stored at `~/.codra/auth.json` with 600 permissions
- API keys never stored in session files
- Secrets redacted from logs
- Sensitive files protected
- Dangerous commands blocked
- Confirmation prompts for file writes and command execution

## Troubleshooting

### Browser did not open

Use headless mode:
```bash
codra-code login --no-browser
```

### Token expired

Run login again:
```bash
codra-code login
```

### Auth endpoint unavailable

Check your network connection or try again later. The Tera auth service may be temporarily unavailable.

### Running in SSH/Terminal

Use headless mode:
```bash
codra-code login --no-browser
```

Then open the printed URL in a browser on another device.

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
