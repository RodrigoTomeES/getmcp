# MCP Hub

Universal installer and configuration tool for MCP (Model Context Protocol) servers across all AI applications.

**The problem:** Every AI app uses a different config format for MCP servers. Claude Desktop uses `mcpServers`, VS Code uses `servers`, Goose uses YAML with `cmd`/`envs`, OpenCode merges command+args into an array... there are 10 apps, 6 root keys, and 3 formats.

**The solution:** One canonical format, config generators for every app, a registry of popular servers, and a CLI that auto-detects your apps and writes the correct config.

## Quick Start

```bash
# Install the GitHub MCP server into all your detected AI apps
npx @mcp-hub/cli add github

# Browse available servers
npx @mcp-hub/cli list

# Search for database servers
npx @mcp-hub/cli list --search=database

# Remove a server
npx @mcp-hub/cli remove github
```

## How It Works

```
                    Canonical Format
                   (FastMCP-aligned)
                         |
    +--------------------+--------------------+
    |         |          |         |          |
 Claude    VS Code    Cursor    Goose    Windsurf  ...
 Desktop   (servers)  (mcpServers) (YAML)  (serverUrl)
```

1. Server definitions are stored in a **canonical format** (aligned with [FastMCP](https://github.com/jlowin/fastmcp))
2. **Config generators** transform the canonical format into each app's specific format
3. The **CLI** auto-detects installed apps, prompts for env vars, and merges configs into existing files (never overwrites)

## Supported Apps

| App | Root Key | Format |
|-----|----------|--------|
| Claude Desktop | `mcpServers` | JSON |
| Claude Code | `mcpServers` | JSON |
| VS Code / Copilot | `servers` | JSON |
| Cursor | `mcpServers` | JSON |
| Cline | `mcpServers` | JSON |
| Roo Code | `mcpServers` | JSON |
| Goose | `extensions` | YAML |
| Windsurf | `mcpServers` | JSON |
| OpenCode | `mcp` | JSONC |
| Zed | `context_servers` | JSON |

## Registry

12 popular MCP servers included out of the box:

| Server | Transport | Description |
|--------|-----------|-------------|
| GitHub | stdio | Repository management, issues, PRs via GitHub API |
| Filesystem | stdio | Secure file operations with access controls |
| Brave Search | stdio | Web search via Brave Search API |
| Memory | stdio | Knowledge graph-based persistent memory |
| Slack | stdio | Channel management and messaging |
| PostgreSQL | stdio | Read-only database access and queries |
| Puppeteer | stdio | Browser automation and web scraping |
| Sequential Thinking | stdio | Structured problem-solving |
| Sentry | remote | Error tracking and monitoring |
| Context7 | remote | Library documentation search |
| Fetch | stdio | Web content fetching and HTML-to-markdown |
| Google Maps | stdio | Location services and geocoding |

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@mcp-hub/cli`](packages/cli) | CLI tool for installing MCP servers | [![npm](https://img.shields.io/npm/v/@mcp-hub/cli)](https://www.npmjs.com/package/@mcp-hub/cli) |
| [`@mcp-hub/core`](packages/core) | Zod schemas, types, and utilities | [![npm](https://img.shields.io/npm/v/@mcp-hub/core)](https://www.npmjs.com/package/@mcp-hub/core) |
| [`@mcp-hub/generators`](packages/generators) | Config generators for 10 apps | [![npm](https://img.shields.io/npm/v/@mcp-hub/generators)](https://www.npmjs.com/package/@mcp-hub/generators) |
| [`@mcp-hub/registry`](packages/registry) | Registry of MCP server definitions | [![npm](https://img.shields.io/npm/v/@mcp-hub/registry)](https://www.npmjs.com/package/@mcp-hub/registry) |
| [`@mcp-hub/web`](packages/web) | Web directory (Next.js, not published) | -- |

## Library Usage

### Generate config for any app

```ts
import { generateConfig, generateAllConfigs } from "@mcp-hub/generators";

// Generate for a specific app
const config = generateConfig("goose", "github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});
// => { extensions: { github: { cmd: "npx", args: [...], envs: {...} } } }

// Generate for ALL apps at once
const all = generateAllConfigs("github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});
// all["claude-desktop"] => JSON string
// all["goose"]          => YAML string
```

### Validate configs with Zod schemas

```ts
import { StdioServerConfig, CanonicalMCPConfig } from "@mcp-hub/core";

StdioServerConfig.parse({ command: "npx", args: ["server"] });
// throws ZodError if invalid
```

### Search the registry

```ts
import { searchServers, getServersByCategory } from "@mcp-hub/registry";

searchServers("database");          // [{ id: "postgres", ... }]
getServersByCategory("web");        // [{ id: "brave-search", ... }, { id: "fetch", ... }]
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests (139 tests)
npm run test

# Build and test a specific package
npm run build --workspace=@mcp-hub/core
npm run test --workspace=@mcp-hub/core
```

## Architecture

```
mcp-hub/
  packages/
    core/          # Zod schemas, TS types, utility functions
    generators/    # 10 config generators (one per app)
    registry/      # 12 MCP server definitions
    cli/           # add/remove/list commands, app detection
    web/           # Next.js web directory (static export)
```

## License

MIT
