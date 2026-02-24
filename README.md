<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="packages/web/public/logo.svg">
    <source media="(prefers-color-scheme: light)" srcset="packages/web/public/logo-light.svg">
    <img alt="getmcp" src="packages/web/public/logo-light.svg" width="280">
  </picture>
</p>

<p align="center">
  Universal installer and configuration tool for MCP (Model Context Protocol) servers across all AI applications.
</p>

**The problem:** Every AI app uses a different config format for MCP servers. Claude Desktop uses `mcpServers`, VS Code uses `servers`, Goose uses YAML with `cmd`/`envs`, Codex uses TOML with `mcp_servers`... there are 19 apps, 6 root keys, and 4 formats.

**The solution:** One canonical format, config generators for every app, a registry of 105+ servers, and a CLI that auto-detects your apps and writes the correct config.

> Browse the full server catalog at [getmcp.es](https://getmcp.es)

## Quick Start

```bash
# Install the GitHub MCP server into all your detected AI apps
npx @getmcp/cli add github

# Browse available servers
npx @getmcp/cli list

# Search for database servers
npx @getmcp/cli list --search=database

# Remove a server
npx @getmcp/cli remove github
```

> **Note:** If you run into issues with `npx`, try `npx @getmcp/cli@latest` — npx can cache stale versions, and v0.7.0 had a broken release.

## Why getmcp?

| Feature              | getmcp                      | Smithery      | mcpm.sh     |
| -------------------- | --------------------------- | ------------- | ----------- |
| Supported apps       | **19**                      | 19            | 14          |
| Registry servers     | **105+**                    | 100K+ (cloud) | 379         |
| Runtime dependency   | **None** (write & done)     | Cloud proxy   | Local proxy |
| Config formats       | **JSON, JSONC, YAML, TOML** | JSON only     | JSON only   |
| License              | **MIT**                     | AGPL          | MIT         |
| Library-first design | **Yes** (npm packages)      | No            | No          |
| Multi-app install    | **Yes** (one command)       | No            | No          |
| Offline/local-first  | **Yes**                     | No            | Partial     |

## How It Works

```
                      Canonical Format
                     (FastMCP-aligned)
                           |
    +----------+-----------+-----------+----------+
    |          |           |           |          |
 Claude     VS Code     Goose      Codex   + 15 more
 Desktop   (servers)   (YAML)     (TOML)     apps
(mcpServers)          (extensions)(mcp_servers)
```

1. Server definitions are stored in a **canonical format** (aligned with [FastMCP](https://github.com/jlowin/fastmcp))
2. **Config generators** transform the canonical format into each app's specific format
3. The **CLI** auto-detects installed apps, prompts for env vars, and merges configs into existing files (never overwrites)

## Supported Apps

| App               | Root Key          | Format |
| ----------------- | ----------------- | ------ |
| Claude Desktop    | `mcpServers`      | JSON   |
| Claude Code       | `mcpServers`      | JSON   |
| VS Code / Copilot | `servers`         | JSON   |
| Cursor            | `mcpServers`      | JSON   |
| Cline             | `mcpServers`      | JSON   |
| Roo Code          | `mcpServers`      | JSON   |
| Goose             | `extensions`      | YAML   |
| Windsurf          | `mcpServers`      | JSON   |
| OpenCode          | `mcp`             | JSONC  |
| Zed               | `context_servers` | JSON   |
| PyCharm           | `mcpServers`      | JSON   |
| Codex             | `mcp_servers`     | TOML   |
| Gemini CLI        | `mcpServers`      | JSON   |
| Continue          | `mcpServers`      | JSON   |
| Amazon Q          | `mcpServers`      | JSON   |
| Trae              | `mcpServers`      | JSON   |
| BoltAI            | `mcpServers`      | JSON   |
| LibreChat         | `mcpServers`      | YAML   |
| Antigravity       | `mcpServers`      | JSON   |

## Registry

105+ MCP servers included out of the box. Here are some highlights:

| Server       | Transport | Description                                                  |
| ------------ | --------- | ------------------------------------------------------------ |
| GitHub       | stdio     | Repository management, issues, PRs via GitHub API            |
| Filesystem   | stdio     | Secure file operations with access controls                  |
| Brave Search | stdio     | Web search via Brave Search API                              |
| Memory       | stdio     | Knowledge graph-based persistent memory                      |
| Playwright   | stdio     | Browser automation, screenshots, and element interaction     |
| PostgreSQL   | stdio     | Read-only database access and queries                        |
| Figma        | stdio     | Read Figma design files and provide layout info to AI agents |
| shadcn/ui    | stdio     | Browse and install shadcn components from AI                 |
| Context7     | remote    | Up-to-date library documentation and code examples           |
| Sentry       | remote    | Error tracking and monitoring                                |
| Supabase     | remote    | Query databases, manage projects, deploy Edge Functions      |
| OpenAI Docs  | remote    | Search OpenAI developer documentation                        |
| Firecrawl    | stdio     | Web scraping and search with JavaScript rendering            |
| Repomix      | stdio     | Pack entire repositories into a single AI-friendly file      |
| n8n          | stdio     | Build and manage n8n automation workflows from AI            |

Browse the full catalog at [getmcp.es](https://getmcp.es) or from the CLI:

```bash
npx @getmcp/cli list
```

## Packages

| Package                                     | Description                             | npm                                                                                                         |
| ------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [`@getmcp/cli`](packages/cli)               | CLI tool for installing MCP servers     | [![npm](https://img.shields.io/npm/v/@getmcp/cli)](https://www.npmjs.com/package/@getmcp/cli)               |
| [`@getmcp/core`](packages/core)             | Zod schemas, types, and utilities       | [![npm](https://img.shields.io/npm/v/@getmcp/core)](https://www.npmjs.com/package/@getmcp/core)             |
| [`@getmcp/generators`](packages/generators) | Config generators for 19 apps           | [![npm](https://img.shields.io/npm/v/@getmcp/generators)](https://www.npmjs.com/package/@getmcp/generators) |
| [`@getmcp/registry`](packages/registry)     | Registry of 105+ MCP server definitions | [![npm](https://img.shields.io/npm/v/@getmcp/registry)](https://www.npmjs.com/package/@getmcp/registry)     |

## Library Usage

### Generate config for any app

```ts
import { generateConfig, generateAllConfigs } from "@getmcp/generators";

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
// all["codex"]          => TOML string
```

### Validate configs with Zod schemas

```ts
import { StdioServerConfig, CanonicalMCPConfig } from "@getmcp/core";

StdioServerConfig.parse({ command: "npx", args: ["server"] });
// throws ZodError if invalid
```

### Search the registry

```ts
import { searchServers, getServersByCategory } from "@getmcp/registry";

searchServers("database"); // [{ id: "postgres", ... }]
getServersByCategory("web"); // [{ id: "brave-search", ... }, { id: "fetch", ... }]
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests (586+ tests)
npm run test

# Build and test a specific package
npm run build --workspace=@getmcp/core
npm run test --workspace=@getmcp/core

# Run the CLI locally (no build needed)
npx tsx packages/cli/src/bin.ts add
npx tsx packages/cli/src/bin.ts list --search=database

# Run the web directory locally
npm run website
```

## Architecture

```
getmcp/
  packages/
    core/          # Zod schemas, TS types, utility functions
    generators/    # 19 config generators (one per app)
    registry/      # 105+ MCP server definitions
    cli/           # add/remove/list/doctor/import commands, app detection
    web/           # Next.js web directory at getmcp.es
```

The CLI supports JSON, JSONC, YAML, and TOML config files natively. Format is auto-detected from the file extension, so Goose configs are read/written as YAML and Codex configs as TOML.

## Contributing

See [`ROADMAP.md`](./.agents/docs/ROADMAP.md) for planned improvements and open tasks. Contributions are welcome.

## Credits

This CLI is inspired by [vercel-labs/skills](https://github.com/vercel-labs/skills).

## License

MIT
