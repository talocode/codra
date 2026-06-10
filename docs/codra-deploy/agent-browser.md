# Agent Browser + Codra Deploy

[Agent Browser](https://github.com/talocode/agent-browser) is the browser automation and visual inspection layer in the Talocode ecosystem.

Codra Deploy can use it after deployment to verify that a live public URL actually works in a real browser — not just that a container started or returned HTTP 200.

## Why use it after deploy

A successful deploy step does not guarantee a healthy frontend:

- the page may render blank
- client-side JavaScript may crash in the browser console
- assets or API calls may fail after load
- the UI may be broken even when the server responds

Agent Browser gives Codra Deploy a post-deploy smoke check that inspects the live page directly.

## What Agent Browser checks

- page load
- page snapshot (title, visible text, links, headings)
- console errors
- failed network requests
- optional screenshot artifact
- optional vision blank/blurry warnings when enabled

## GitHub Action usage

Agent Browser is externally verified and available as a GitHub Action:

```yaml
uses: talocode/agent-browser@v0
```

Verified in [talocode/agent-browser-action-test](https://github.com/talocode/agent-browser-action-test/actions/runs/27259693056).

## Recommended post-deploy flow

1. Deploy the app with Codra Deploy.
2. Capture the deployed public URL from the deploy step output.
3. Run `talocode/agent-browser@v0` against that URL.
4. Fail the workflow when console errors, network failures, or blank-page vision checks are detected.
5. Upload the screenshot and JSON report as workflow artifacts for Codra to inspect.

## Example workflow

See [examples/codra-deploy/github-actions/agent-browser-smoke.yml](../../examples/codra-deploy/github-actions/agent-browser-smoke.yml).

```yaml
- name: Verify deployed frontend
  uses: talocode/agent-browser@v0
  with:
    url: ${{ steps.deploy.outputs.url }}
    screenshot-out: agent-browser-screenshot.png
    vision: "false"
    upload-artifact: "true"
    fail-on-console-errors: "true"
    fail-on-network-errors: "true"
    fail-on-blank: "true"
```

## Safety notes

- Agent Browser only allows public `http://` and `https://` URLs by default.
- Private network and localhost targets are blocked unless explicitly overridden for local development.
- Vision is optional; `vision: false` does not require Python or OpenCV.
- Agent Browser does not automate login, bypass CAPTCHAs, or scrape private/internal networks by default.

## Future Codra integration

Planned CLI commands:

```bash
codra deploy verify <url>
# or
codra browser check <url>
```

Future Codra loop:

1. Codra Deploy publishes a URL.
2. Agent Browser returns a structured pass/warn/fail report.
3. Codra reads the report, explains the issue, and suggests a fix.

These commands are not implemented yet. This document is the first integration template.