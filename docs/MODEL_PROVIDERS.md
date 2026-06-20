# Model Providers

Codra supports provider-agnostic model configuration through the global user config at `~/.codra/config.toml`.

## Example

```toml
model = "gpt-5.5"
model_provider = "openai"
oss_provider = "ollama"

[model_providers.openai]
name = "OpenAI"
base_url = "https://api.openai.com/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
```

Only global user config may define provider credentials, base URLs, auth commands, or credential helpers.
Project-local `.codra/harness/` files are treated as harness metadata only and cannot override provider auth.

## Commands

- `codra provider list`
- `codra provider show`
- `codra provider check`
- `codra provider add`
- `codra provider use <provider>`
- `codra --provider <provider>`
- `codra --oss`

