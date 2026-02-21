# Contributing to getmcp

Thanks for your interest in contributing to getmcp! This guide covers how to add a new MCP server to the registry and general development workflow.

## Adding a New MCP Server

### Quick Start

1. **Scaffold the entry** using the CLI wizard:

   ```bash
   npx getmcp init
   ```

   This creates a TypeScript file in `packages/registry/src/servers/`.

2. **Register it** in `packages/registry/src/index.ts`:

   ```typescript
   import { myServer } from "./servers/my-server.js";
   // ... in the register() calls:
   register(myServer);
   // ... in the re-exports:
   export { myServer };
   ```

3. **Add it to the test file** in `packages/registry/tests/registry.test.ts`:

   ```typescript
   import { myServer } from "../src/index.js";
   // Add to the allServers array and the imports
   ```

4. **Run tests** to validate:

   ```bash
   npx vitest run packages/registry
   ```

### Server Entry Format

Each server file exports a `RegistryEntryType` object:

```typescript
import type { RegistryEntryType } from "@getmcp/core";

export const myServer: RegistryEntryType = {
  id: "my-server",              // Unique, lowercase, hyphens only
  name: "My Server",            // Display name
  description: "What it does",  // One-line description
  config: {
    command: "npx",
    args: ["-y", "my-server-pkg"],
    env: { API_KEY: "" },
    transport: "stdio",
  },
  package: "my-server-pkg",     // npm or PyPI package name
  version: "1.0.0",             // Current package version
  runtime: "node",              // "node" | "python" | "docker" | "binary"
  repository: "https://github.com/user/repo",
  homepage: "https://github.com/user/repo",
  author: "Author Name",
  categories: ["developer-tools"],
  requiredEnvVars: ["API_KEY"],
};
```

### Available Categories

`developer-tools`, `web`, `automation`, `data`, `search`, `ai`, `cloud`, `communication`, `design`, `documentation`, `devops`, `utilities`, `security`, `gaming`

### Validation

All entries are validated at test time against the `RegistryEntry` Zod schema. You can also validate against the published JSON Schema:

```bash
# Generate the JSON Schema
npm run generate-schema --workspace=packages/core

# The schema is at packages/core/registry-entry.schema.json
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
  registry/     - MCP server catalog
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
- Include tests (the server should appear in the `allServers` array in `registry.test.ts`)
- All tests must pass (`npx vitest run`)
- Follow the existing code style (no linter config needed, just match what's there)

## Questions?

Open an issue at https://github.com/RodrigoTomeES/getmcp/issues
