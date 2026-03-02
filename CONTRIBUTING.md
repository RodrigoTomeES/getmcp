# Contributing to getmcp

Thanks for your interest in contributing to getmcp!

## MCP Server Registry

Server data in getmcp comes from the [official MCP registry](https://registry.modelcontextprotocol.io). To add a new server, submit it to the official registry — getmcp syncs automatically.

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
  generators/   - Config generators for 19 AI apps
  registry/     - MCP server catalog (synced from official registry)
  cli/          - CLI tool (getmcp)
  web/          - Next.js web directory
```

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
feat(generators): add support for new AI app
fix(cli): handle missing config file
docs: update CONTRIBUTING.md
test(registry): add edge case tests
```

Use the package name as scope: `core`, `generators`, `registry`, `cli`, `web`.

## Pull Requests

- All tests must pass (`npx vitest run`)
- Follow the existing code style (oxlint + oxfmt enforced via pre-commit hook)

## Questions?

Open an issue at https://github.com/RodrigoTomeES/getmcp/issues
