# Security Policy

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Please report vulnerabilities privately by emailing:

**talocodehq@gmail.com**

We will respond as quickly as possible and coordinate a fix.

## Local-First Security Principles

Codra is designed with strong local-first principles:

- User code and data should never leave the user's machine unless explicitly configured.
- Agent actions that modify files or run commands require human approval.
- Secrets, tokens, and credentials must not be exposed in prompts, logs, or browser sessions.
- Remote Talocode features are opt-in and should never be enabled by default.

## Scope

This policy applies to the Codra desktop application and its Rust/TypeScript components. It does not cover third-party dependencies unless a vulnerability is discovered in how Codra uses them.

Thank you for helping keep Codra and its users secure.