# OSS Mode

Codra OSS mode uses the configured `oss_provider` from `~/.codra/config.toml`.

If `oss_provider` is missing, Codra defaults to `ollama`.

## Examples

```bash
codra --oss
codra --provider ollama
codra --provider lmstudio
```

Default local endpoints:

- Ollama: `http://localhost:11434/v1`
- LM Studio: `http://localhost:1234/v1`

If the local service is not running, `codra provider check` should report a clear connectivity failure without printing secrets.

