# Codra (Python)

Local-first AI coding agent API client — repo summaries, code explain, code review, and implementation planning.

```bash
pip install talocode-codra
```

## Usage

```python
from codra import CodraClient

client = CodraClient(api_key="your_talocode_key")

# Explain code
result = client.explain("python", "def hello(): print('hi')")
print(result["result"]["explanation"])

# Review code
result = client.review("typescript", "const x: any = 1;", focus=["bugs", "types"])

# Plan implementation
result = client.plan("Add user authentication", context="FastAPI + SQLAlchemy project")

# Repo summary
files = [{"path": "src/main.py", "content": "print('hello')"}]
result = client.repo_summary(files)
```

## CLI

```bash
codra health
codra explain --language python --code "print('hello')"
codra review --language typescript --code "const x = 1;"
codra plan --task "Add login feature"
```

Requires `TALOCODE_API_KEY` environment variable.
