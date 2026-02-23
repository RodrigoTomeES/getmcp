# Contributing to getmcp

Thanks for your interest in contributing to getmcp! This guide covers how to add a new MCP server to the registry and general development workflow.

## Adding a New MCP Server

### Quick Start

Create a single JSON file in `packages/registry/servers/`:

```bash
# File: packages/registry/servers/my-server.json
```

```json
{
  "$schema": "https://getmcp.es/registry-entry.schema.json",
  "id": "my-server",
  "name": "My Server",
  "description": "What it does",
  "config": {
    "command": "npx",
    "args": ["-y", "my-server-pkg"],
    "env": { "API_KEY": "" },
    "transport": "stdio"
  },
  "package": "my-server-pkg",
  "runtime": "node",
  "repository": "https://github.com/user/repo",
  "homepage": "https://github.com/user/repo",
  "author": "Author Name",
  "categories": ["developer-tools"],
  "requiredEnvVars": ["API_KEY"]
}
```

That's it — **one file, no other changes needed**. The registry auto-discovers all `.json` files in `servers/`.

The `$schema` field enables autocompletion and validation in your editor (VS Code, JetBrains, etc.).

### Rules

- **Filename must match `id`**: `my-server.json` must contain `"id": "my-server"`
- **All fields are validated** at build time against the [RegistryEntry Zod schema](packages/core/src/schemas.ts)

### Run Tests

```bash
npx vitest run packages/registry
```

### Available Categories

`developer-tools`, `web`, `automation`, `data`, `search`, `ai`, `cloud`, `communication`, `design`, `documentation`, `devops`, `utilities`, `security`, `gaming`

### Remote (SSE/HTTP) Servers

For servers accessed via URL instead of a local command:

```json
{
  "$schema": "https://getmcp.es/registry-entry.schema.json",
  "id": "my-remote-server",
  "name": "My Remote Server",
  "description": "A remote MCP server",
  "config": {
    "url": "https://example.com/mcp/sse",
    "transport": "sse",
    "headers": {}
  },
  "runtime": "node",
  "author": "Author Name",
  "categories": ["web"],
  "requiredEnvVars": []
}
```

## Development Setup

### Prerequisites

- Node.js >= 22
- npm >= 10

### Install & Build

```bash
npm install
npm run build --workspaces
```

### Run Tests

```bash
# All tests
npx vitest run

# Specific package
npx vitest run packages/core
npx vitest run packages/generators
npx vitest run packages/registry
npx vitest run packages/cli
```

### Project Structure

```
packages/
  core/         - Zod schemas, types, utilities
  generators/   - Config generators for 12 AI apps
  registry/     - MCP server catalog (servers/*.json)
  cli/          - CLI tool (getmcp)
  web/          - Next.js web directory
```

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
feat(registry): add my-server to registry
fix(cli): handle missing config file
docs: update CONTRIBUTING.md
test(registry): add edge case tests
```

Use the package name as scope: `core`, `generators`, `registry`, `cli`, `web`.

## Pull Requests

- One server per PR when adding new servers
- All tests must pass (`npx vitest run`)
- Follow the existing code style (no linter config needed, just match what's there)

## Questions?

Open an issue at https://github.com/RodrigoTomeES/getmcp/issues
