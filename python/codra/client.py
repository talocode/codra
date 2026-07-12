import json
import os
import urllib.request
import urllib.error


class CodraError(Exception):
    pass


class CodraClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or os.environ.get("TALOCODE_API_KEY")
        self.base_url = (base_url or os.environ.get("TALOCODE_BASE_URL", "https://api.talocode.site")).rstrip("/")

    def _headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    def _request(self, method: str, path: str, body: dict | None = None) -> dict:
        url = f"{self.base_url}{path}"
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=self._headers(), method=method)
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                detail = json.loads(e.read().decode())
                msg = detail.get("error", {}).get("message", str(e))
            except Exception:
                msg = str(e)
            raise CodraError(msg)

    def health(self) -> dict:
        return self._request("GET", "/v1/codra/health")

    def repo_summary(self, files: list[dict], focus: list[str] | None = None) -> dict:
        body = {"files": files}
        if focus:
            body["focus"] = focus
        return self._request("POST", "/v1/codra/repo-summary", body)

    def explain(self, language: str, code: str, level: str = "intermediate") -> dict:
        return self._request("POST", "/v1/codra/explain", {
            "language": language, "code": code, "level": level,
        })

    def review(self, language: str, code: str, focus: list[str] | None = None,
               strictness: str = "normal") -> dict:
        body = {"language": language, "code": code, "strictness": strictness}
        if focus:
            body["focus"] = focus
        return self._request("POST", "/v1/codra/review", body)

    def plan(self, task: str, context: str | None = None,
             constraints: list[str] | None = None) -> dict:
        body = {"task": task}
        if context:
            body["context"] = context
        if constraints:
            body["constraints"] = constraints
        return self._request("POST", "/v1/codra/plan", body)


def create_codra_client(api_key: str | None = None, base_url: str | None = None) -> CodraClient:
    return CodraClient(api_key, base_url)
