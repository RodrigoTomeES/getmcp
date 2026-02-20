# getmcp — Specification

> A universal installer and configuration tool for MCP (Model Context Protocol) servers across all AI applications.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [The Problem: MCP Config Fragmentation](#2-the-problem-mcp-config-fragmentation)
3. [Architecture](#3-architecture)
4. [Canonical Schema](#4-canonical-schema)
5. [Config Generators](#5-config-generators)
6. [Registry](#6-registry)
7. [CLI Tool](#7-cli-tool)
8. [Phase 3: Web Directory (Planned)](#8-phase-3-web-directory-planned)
9. [Future Plans](#9-future-plans)
10. [Research Appendix: Config Formats Per App](#10-research-appendix-config-formats-per-app)

---

## 1. Project Overview

### What is getmcp?

getmcp is a tool that solves a fundamental problem in the AI tooling ecosystem: **every AI application uses a different configuration format for MCP servers**. MCP (Model Context Protocol) is an open protocol that enables LLMs to access custom tools and services, but there is no standard way to configure these servers across different AI apps.

getmcp provides:

- **A canonical configuration format** aligned with [FastMCP](https://github.com/jlowin/fastmcp)'s standard
- **Config generators** that transform the canonical format into 10 app-specific formats
- **A registry** of popular MCP server definitions
- **A CLI tool** for one-command installation into any detected AI app
- **(Planned) A web directory** for browsing and discovering MCP servers

### Inspiration

Inspired by [skills.sh](https://skills.sh/) — a platform that provides one-command installation of tools. getmcp applies the same model to the MCP server ecosystem: a central registry, auto-detection of installed apps, config merging (not overwriting), and simple add/remove/list commands.

### Key Design Principles

1. **Never overwrite** — always read existing configs, merge new servers in, write back
2. **Canonical format** — one source of truth (FastMCP-aligned), generators handle the rest
3. **Auto-detect** — find installed AI apps by checking known config file paths
4. **Platform-aware** — resolve `~`, `%AppData%`, `%UserProfile%` per OS
5. **Schema-validated** — all data flows through Zod schemas at runtime

---

## 2. The Problem: MCP Config Fragmentation

### 11 Apps, 6 Root Keys, 3 Formats

Every major AI application that supports MCP has chosen a slightly (or drastically) different configuration format. Here is the fragmentation landscape:

| App | Root Key | Format | Config Location | Command Key | Env Key | Remote URL Key |
|-----|----------|--------|-----------------|-------------|---------|----------------|
| Claude Desktop | `mcpServers` | JSON | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%AppData%\Claude\claude_desktop_config.json` (Win) | `command` | `env` | — |
| Claude Code | `mcpServers` | JSON | `.mcp.json` (project), `~/.claude.json` (user) | `command` | `env` | `url` |
| VS Code / Copilot | `servers` | JSON | `.vscode/mcp.json` | `command` | `env` | `url` |
| Cursor | `mcpServers` | JSON | `.cursor/mcp.json` | `command` | `env` | `url` |
| Cline | `mcpServers` | JSON | `cline_mcp_settings.json` | `command` | `env` | `url` |
| Roo Code | `mcpServers` | JSON | `mcp_settings.json`, `.roo/mcp.json` | `command` | `env` | `url` |
| Goose | `extensions` | **YAML** | `~/.config/goose/config.yaml` | `cmd` | `envs` | `uri` |
| Windsurf | `mcpServers` | JSON | `~/.codeium/windsurf/mcp_config.json` | `command` | `env` | `serverUrl` |
| OpenCode | `mcp` | JSONC | `opencode.json` | `command` (array) | `environment` | `url` |
| Zed | `context_servers` | JSON | `settings.json` | `command` | `env` | `url` |
| PyCharm | `mcpServers` | JSON | `.ai/mcp/mcp.json` (project-level) | `command` | `env` | `url` |

### Key Fragmentation Dimensions

| Dimension | Variations Found |
|-----------|-----------------|
| Root key | `mcpServers`, `servers`, `extensions`, `mcp`, `context_servers` |
| Config format | JSON, JSONC, YAML |
| Command key | `command` (string) vs `cmd` (string) vs `command` (array with args merged) |
| Env key | `env` vs `envs` vs `environment` |
| Remote URL key | `url` vs `serverUrl` vs `uri` |
| Transport declaration | Implicit (most) vs `type` field (VS Code, Roo Code) vs `transport` field |
| Extra fields | `alwaysAllow`, `disabled`, `timeout`, `watchPaths`, `disabledTools`, `cwd`, `enabled` |
| Env var syntax | Direct values, `${VAR}`, `${VAR:-default}`, `${env:VAR}`, `{env:VAR}` |
| Windows handling | Some need `cmd /c` wrapper |
| Install method | File edit, CLI commands, UI, extensions, marketplace |

---

## 3. Architecture

### Monorepo Structure

```
getmcp/
  package.json                     # Root workspace config
  tsconfig.json                    # Shared TypeScript settings
  SPECIFICATION.md                 # This file
  packages/
    core/                          # @getmcp/core (v0.1.0)
      src/
        schemas.ts                 # Zod validation schemas
        types.ts                   # TypeScript types (inferred from Zod)
        utils.ts                   # Type guards + transport inference
        index.ts                   # Public API barrel
      tests/
        schemas.test.ts            # 19 tests
        utils.test.ts              # 11 tests

    generators/                    # @getmcp/generators (v0.1.0)
      src/
        base.ts                    # BaseGenerator class + helpers
        claude-desktop.ts          # Generator for Claude Desktop
        claude-code.ts             # Generator for Claude Code CLI
        vscode.ts                  # Generator for VS Code / Copilot
        cursor.ts                  # Generator for Cursor
        cline.ts                   # Generator for Cline
        roo-code.ts                # Generator for Roo Code
        goose.ts                   # Generator for Goose (YAML)
        windsurf.ts                # Generator for Windsurf
        opencode.ts                # Generator for OpenCode
        zed.ts                     # Generator for Zed
        index.ts                   # Generator registry + public API
      tests/
        generators.test.ts         # 45 tests

    registry/                      # @getmcp/registry (v0.1.0)
      src/
        servers/
          github.ts                # GitHub MCP Server
          filesystem.ts            # Filesystem MCP Server
          brave-search.ts          # Brave Search
          memory.ts                # Memory (knowledge graph)
          slack.ts                 # Slack
          postgres.ts              # PostgreSQL
          puppeteer.ts             # Puppeteer (browser automation)
          sequential-thinking.ts   # Sequential Thinking
          sentry.ts                # Sentry (remote SSE)
          context7.ts              # Context7 (remote HTTP)
          fetch.ts                 # Fetch (Python)
          google-maps.ts           # Google Maps
        index.ts                   # Registry API (search, filter, lookup)
      tests/
        registry.test.ts           # 37 tests

    cli/                           # @getmcp/cli (v0.1.0)
      src/
        bin.ts                     # CLI entry point (getmcp command)
        detect.ts                  # App auto-detection
        config-file.ts             # Config read/write/merge operations
        commands/
          add.ts                   # getmcp add [server-id]
          remove.ts                # getmcp remove <server-name>
          list.ts                  # getmcp list [options]
        index.ts                   # Public API barrel
      tests/
        detect.test.ts             # 7 tests
        config-file.test.ts        # 20 tests
```

### Dependency Graph

```
@getmcp/cli
  |---> @getmcp/generators ---> @getmcp/core
  |---> @getmcp/registry   ---> @getmcp/core
  |---> @inquirer/prompts (interactive prompts)
```

All packages use:
- TypeScript with `NodeNext` module resolution
- Zod for runtime validation
- Vitest for testing
- npm workspaces for monorepo management

### Design Decision: FastMCP Alignment

[FastMCP](https://github.com/jlowin/fastmcp) (22.9k+ stars) defines a `CanonicalMCPConfig` format in its Python SDK. We align our canonical format with theirs:

- Root key: `mcpServers`
- Stdio: `command`, `args`, `env`, `cwd`, `timeout`, `description`
- Remote: `url`, `transport`, `headers`, `timeout`, `description`
- `extra="allow"` pattern — unknown fields pass through

This means our canonical format is directly compatible with the most widely-used MCP framework. Our generators then transform *from* this standard *to* each app's specific format.

---

## 4. Canonical Schema

### StdioServerConfig

For servers that run as local processes via stdio transport.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `command` | `string` | Yes | — | The executable (e.g., `"npx"`, `"uvx"`, `"docker"`) |
| `args` | `string[]` | No | `[]` | Arguments passed to the command |
| `env` | `Record<string, string>` | No | `{}` | Environment variables |
| `transport` | `"stdio"` | No | `"stdio"` | Transport type (always stdio) |
| `cwd` | `string` | No | — | Working directory for execution |
| `timeout` | `number` | No | — | Max response time in milliseconds |
| `description` | `string` | No | — | Human-readable description |

### RemoteServerConfig

For servers accessible via HTTP, Streamable HTTP, or SSE.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | `string` (URL) | Yes | — | The server URL |
| `transport` | `"http" \| "streamable-http" \| "sse"` | No | Inferred | Transport type (auto-inferred from URL if absent) |
| `headers` | `Record<string, string>` | No | `{}` | HTTP headers |
| `timeout` | `number` | No | — | Max response time in milliseconds |
| `description` | `string` | No | — | Human-readable description |

**Transport inference**: URLs containing `/sse` in the path are inferred as SSE; all others default to HTTP. This matches FastMCP's logic.

### CanonicalMCPConfig (Root Format)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/name"],
      "env": { "API_KEY": "value" }
    }
  }
}
```

### RegistryEntry (Metadata Layer)

Extends the canonical server config with discovery and display metadata.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique ID, lowercase alphanumeric with hyphens (e.g., `"github"`) |
| `name` | `string` | Yes | Display name (e.g., `"GitHub"`) |
| `description` | `string` | Yes | What the server does |
| `config` | `StdioServerConfig \| RemoteServerConfig` | Yes | The canonical server configuration |
| `package` | `string` | No | npm/pypi package name |
| `runtime` | `"node" \| "python" \| "docker" \| "binary"` | No | Execution runtime |
| `repository` | `string` (URL) | No | Source code URL |
| `homepage` | `string` (URL) | No | Homepage URL |
| `author` | `string` | No | Author or organization |
| `categories` | `string[]` | No | Discovery categories |
| `requiredEnvVars` | `string[]` | No | Env vars the user must provide |
| `windows` | `PlatformOverride` | No | Windows-specific command overrides |
| `linux` | `PlatformOverride` | No | Linux-specific command overrides |
| `macos` | `PlatformOverride` | No | macOS-specific command overrides |

### Supported App IDs

```typescript
type AppId =
  | "claude-desktop"
  | "claude-code"
  | "vscode"
  | "cursor"
  | "cline"
  | "roo-code"
  | "goose"
  | "windsurf"
  | "opencode"
  | "zed"
  | "pycharm";
```

---

## 5. Config Generators

Each generator implements the `ConfigGenerator` interface:

```typescript
interface ConfigGenerator {
  app: AppMetadata;
  generate(serverName: string, config: LooseServerConfig): Record<string, unknown>;
  generateAll(servers: Record<string, LooseServerConfig>): Record<string, unknown>;
  serialize(config: Record<string, unknown>): string;
}
```

### Generator Transformation Rules

#### Claude Desktop — `ClaudeDesktopGenerator`
- **Passthrough**: canonical format IS the native format
- Root key: `mcpServers`
- Config path: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%AppData%\Claude\claude_desktop_config.json` (Windows)
- Omits empty `args` and `env`

#### Claude Code — `ClaudeCodeGenerator`
- **Near-passthrough**: same as canonical with `type` field for remote
- Root key: `mcpServers`
- Config path: `.mcp.json` (project scope)
- Remote servers: renames `transport` to `type`
- Supports `${VAR}` and `${VAR:-default}` env variable syntax

#### VS Code / Copilot — `VSCodeGenerator`
- Root key: **`servers`** (not `mcpServers`)
- Config path: `.vscode/mcp.json`
- **Adds explicit `type` field** on every server (`"stdio"`, `"http"`, `"sse"`)
- Maps `streamable-http` to `"http"`
- Supports `inputs` array for sensitive data (not generated, but preserved)

#### Cursor — `CursorGenerator`
- **Passthrough**: same as Claude Desktop
- Root key: `mcpServers`
- Config path: `.cursor/mcp.json`

#### Cline — `ClineGenerator`
- Root key: `mcpServers`
- **Adds** `alwaysAllow: []` and `disabled: false` to every server
- Remote servers use `url` + `headers` (no `command`/`args`)
- Config path: `cline_mcp_settings.json` (in VS Code globalStorage)

#### Roo Code — `RooCodeGenerator`
- Root key: `mcpServers`
- **Adds** `alwaysAllow: []` and `disabled: false`
- Remote servers: adds `type: "streamable-http"` or `type: "sse"`
- Maps canonical `http` to `"streamable-http"` (Roo Code's naming)
- Config path: `mcp_settings.json` (in VS Code globalStorage)

#### Goose — `GooseGenerator`
- Root key: **`extensions`** (not `mcpServers`)
- Format: **YAML** (not JSON)
- **Renames**: `command` -> `cmd`, `env` -> `envs`
- **Adds**: `name` (display name), `enabled: true`, `type: "stdio"`
- **Converts**: timeout from milliseconds to seconds
- Custom `serialize()` method outputs YAML
- Config path: `~/.config/goose/config.yaml`

#### Windsurf — `WindsurfGenerator`
- Root key: `mcpServers`
- Stdio: passthrough (same as canonical)
- Remote: **uses `serverUrl`** instead of `url`
- Supports `${env:VARIABLE_NAME}` interpolation
- Config path: `~/.codeium/windsurf/mcp_config.json`

#### OpenCode — `OpenCodeGenerator`
- Root key: **`mcp`** (not `mcpServers`)
- **Merges** `command` + `args` into a single `command` array
- **Renames**: `env` -> `environment`
- **Adds**: `type: "local"` or `type: "remote"`, `enabled: true`
- `generateAll()` adds `$schema: "https://opencode.ai/config.json"`
- Env var syntax: `{env:VAR}` (no `$` prefix)
- Config path: `opencode.json`

#### Zed — `ZedGenerator`
- Root key: **`context_servers`** (not `mcpServers`)
- Otherwise standard `command`/`args`/`env` structure
- Remote: `url` + `headers`
- Config path: `~/.config/zed/settings.json`

#### PyCharm — `PyCharmGenerator`
- **Passthrough**: same as Claude Desktop / Cursor
- Root key: `mcpServers`
- Config path: `.ai/mcp/mcp.json` (project-level, cross-platform)
- PyCharm supports project-level MCP configuration via `.ai/mcp/mcp.json`, similar to VS Code's `.vscode/mcp.json`
- This file is shareable via version control and uses the canonical `mcpServers` format
- Requires the [JetBrains AI Assistant](https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant) plugin
- **Important**: PyCharm must be closed and reopened for config changes to take effect
- Supports stdio, streamable-http, and SSE transports
- Docs: https://www.jetbrains.com/help/ai-assistant/mcp.html

### Transformation Summary Table

| App | Root Key | `command` | `args` | `env` | Remote URL | Extra Fields | Format |
|-----|----------|-----------|--------|-------|------------|--------------|--------|
| Claude Desktop | `mcpServers` | `command` | `args` | `env` | `url` | — | JSON |
| Claude Code | `mcpServers` | `command` | `args` | `env` | `url` + `type` | — | JSON |
| VS Code | `servers` | `command` | `args` | `env` | `url` + `type` | `type` on all | JSON |
| Cursor | `mcpServers` | `command` | `args` | `env` | `url` | — | JSON |
| Cline | `mcpServers` | `command` | `args` | `env` | `url` | `alwaysAllow`, `disabled` | JSON |
| Roo Code | `mcpServers` | `command` | `args` | `env` | `url` + `type` | `alwaysAllow`, `disabled` | JSON |
| Goose | `extensions` | `cmd` | `args` | `envs` | `uri` | `name`, `enabled`, `type`, `timeout` (sec) | YAML |
| Windsurf | `mcpServers` | `command` | `args` | `env` | `serverUrl` | — | JSON |
| OpenCode | `mcp` | `command` (array) | (merged) | `environment` | `url` + `type` | `type`, `enabled` | JSONC |
| Zed | `context_servers` | `command` | `args` | `env` | `url` | — | JSON |
| PyCharm | `mcpServers` | `command` | `args` | `env` | `url` | — | JSON |

---

## 6. Registry

### Built-in Servers (12)

| # | ID | Name | Transport | Runtime | Required Env Vars | Categories |
|---|-----|------|-----------|---------|-------------------|------------|
| 1 | `brave-search` | Brave Search | stdio | node | `BRAVE_API_KEY` | search, web |
| 2 | `context7` | Context7 | remote (HTTP) | node | — | documentation, search, developer-tools |
| 3 | `fetch` | Fetch | stdio | python | — | web, utilities |
| 4 | `filesystem` | Filesystem | stdio | node | — | filesystem, utilities |
| 5 | `github` | GitHub | stdio | node | `GITHUB_PERSONAL_ACCESS_TOKEN` | developer-tools, git, version-control |
| 6 | `google-maps` | Google Maps | stdio | node | `GOOGLE_MAPS_API_KEY` | maps, location, utilities |
| 7 | `memory` | Memory | stdio | node | — | memory, knowledge-graph |
| 8 | `postgres` | PostgreSQL | stdio | node | `POSTGRES_CONNECTION_STRING` | database, sql |
| 9 | `puppeteer` | Puppeteer | stdio | node | — | browser, automation, web-scraping |
| 10 | `sequential-thinking` | Sequential Thinking | stdio | node | — | reasoning, utilities |
| 11 | `sentry` | Sentry | remote (SSE) | node | — | monitoring, error-tracking, developer-tools |
| 12 | `slack` | Slack | stdio | node | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` | communication, messaging |

### Registry API

```typescript
getServer(id: string): RegistryEntry | undefined
getServerOrThrow(id: string): RegistryEntry
getServerIds(): string[]
getAllServers(): RegistryEntry[]
searchServers(query: string): RegistryEntry[]
getServersByCategory(category: string): RegistryEntry[]
getCategories(): string[]
getServerCount(): number
```

**Search** matches against: id, name, description, categories, and author (case-insensitive).

### Adding a New Server

1. Create a file in `packages/registry/src/servers/<id>.ts`
2. Export a `RegistryEntryType` object with all required fields
3. Import and register it in `packages/registry/src/index.ts`
4. Add a test in `packages/registry/tests/registry.test.ts`

Example:

```typescript
import type { RegistryEntryType } from "@getmcp/core";

export const myServer: RegistryEntryType = {
  id: "my-server",
  name: "My Server",
  description: "Description of what this server does",
  config: {
    command: "npx",
    args: ["-y", "@my/mcp-server"],
    env: { API_KEY: "" },
    transport: "stdio",
  },
  package: "@my/mcp-server",
  runtime: "node",
  categories: ["category"],
  requiredEnvVars: ["API_KEY"],
};
```

---

## 7. CLI Tool

### Installation (Planned)

```bash
npx @getmcp/cli add github
```

### Commands

#### `getmcp add [server-id]`

Interactive installation workflow:

1. If `server-id` provided: looks up in registry (falls back to fuzzy search)
2. If not provided: shows interactive selection of all servers
3. Prompts for required environment variables
4. Auto-detects installed AI apps on the system
5. User selects which apps to configure (all pre-selected)
6. Generates app-specific config for each selected app
7. Merges into existing config files (preserves all existing servers)
8. Reports success per app

#### `getmcp remove <server-name>`

1. Scans all detected apps for the named server
2. Shows which apps have it configured
3. User selects which apps to remove from
4. Confirms removal
5. Removes the server entry from each selected config
6. Reports results

#### `getmcp list [options]`

| Option | Description |
|--------|-------------|
| (none) | List all servers in registry |
| `--installed` | List servers configured in detected apps |
| `--search=<query>` | Search the registry |
| `--category=<cat>` | Filter by category |

### App Auto-Detection

The CLI detects installed apps by resolving platform-specific config paths:

```
~/              -> os.homedir()
%AppData%       -> process.env.APPDATA (or ~/AppData/Roaming)
%UserProfile%   -> os.homedir()
%LocalAppData%  -> process.env.LOCALAPPDATA (or ~/AppData/Local)
```

An app is considered "detected" if either:
- Its config file exists, OR
- Its config file's parent directory exists (the app is installed but hasn't been configured yet)

### Config Merging Strategy

**Critical principle: never overwrite existing configuration.**

1. `readConfigFile(path)` — reads existing JSON/JSONC, returns `{}` if missing
2. `mergeServerIntoConfig(path, generated)` — deep-merges the new server under the root key, preserving all existing servers and non-server settings
3. `writeConfigFile(path, config)` — writes back with pretty formatting, creates parent dirs if needed

JSONC support: strips `//` and `/* */` comments before parsing (for VS Code and OpenCode compatibility).

### Config File Operations API

```typescript
readConfigFile(filePath: string): Record<string, unknown>
writeConfigFile(filePath: string, config: Record<string, unknown>): void
mergeServerIntoConfig(filePath: string, generatedConfig: Record<string, unknown>): Record<string, unknown>
removeServerFromConfig(filePath: string, serverName: string): Record<string, unknown> | null
listServersInConfig(filePath: string): string[]
```

`listServersInConfig` scans all known root keys (`mcpServers`, `servers`, `extensions`, `mcp`, `context_servers`) to find server entries regardless of which app's format the file uses.

---

## 8. Phase 3: Web Directory (Planned)

### Overview

A Next.js website that serves as a public directory for MCP servers. Think "npm registry for MCP servers" with one-click config generation.

### Planned Features

- **Browse & Search**: explore all registered servers with filtering by category, transport type, runtime
- **Server Detail Pages**: description, setup instructions, required env vars, links to docs/repo
- **Config Generator UI**: select an app, see the exact config snippet to copy-paste
- **"Copy Config" Button**: one-click copy of app-specific JSON/YAML for any server + app combination
- **Leaderboard / Popularity**: ranking of servers (stretch goal)
- **Community Submissions**: form or PR-based flow for adding new servers to the registry (stretch goal)

### Tech Stack (Planned)

- Next.js (App Router)
- Tailwind CSS
- The existing `@getmcp/core`, `@getmcp/generators`, and `@getmcp/registry` packages imported directly
- Static generation for server pages (data comes from the registry)

---

## 9. Future Plans

### Additional Apps to Support

| App | Priority | Status |
|-----|----------|--------|
| Amazon Q | Medium | Not yet researched |
| JetBrains AI | Medium | Not yet researched |
| LM Studio | Low | Not yet researched |
| Continue | Low | Not yet researched |
| Gemini CLI | Medium | Not yet researched |

### Additional CLI Commands

- `getmcp update` — update a server's config (e.g., after env var changes)
- `getmcp sync` — sync all app configs to match a canonical source
- `getmcp doctor` — diagnose config issues across apps
- `getmcp init` — generate a `.getmcp.json` project file

### Registry Enhancements

- JSON Schema for server definitions (for external validation)
- Version tracking per server
- Compatibility matrix (which servers work with which apps)
- Community submission workflow (GitHub PR template)

### npm Publishing

- Publish `@getmcp/cli` to npm so users can run `npx @getmcp/cli add github`
- Publish `@getmcp/core` and `@getmcp/generators` for library consumers

### CLI Multi-Format Config File Support — IMPLEMENTED

The CLI's `config-file.ts` module now supports JSON, JSONC, YAML, and TOML formats. Format is auto-detected from the file extension via `detectConfigFormat()` in `format.ts`.

#### Implementation Details

| Extension(s) | Format | Parser | Serializer |
|---|---|---|---|
| `.json`, `.jsonc` | JSON/JSONC | `JSON.parse` (with proper string-aware comment stripping for JSONC) | `JSON.stringify` |
| `.yaml`, `.yml` | YAML | `yaml` library (`YAML.parse`) | `yaml` library (`YAML.stringify`) |
| `.toml` | TOML | `smol-toml` library (`TOML.parse`) | `smol-toml` library (`TOML.stringify`) |

All five config operations are format-aware:

- `readConfigFile(filePath)` — auto-detects format from extension, dispatches to correct parser
- `writeConfigFile(filePath, config)` — auto-detects format from extension, dispatches to correct serializer
- `mergeServerIntoConfig(filePath, generatedConfig)` — format-agnostic merge logic; format handled at read/write boundaries
- `removeServerFromConfig(filePath, serverName)` — same approach
- `listServersInConfig(filePath)` — scans all known root keys including `mcp_servers` (Codex)

The JSONC comment stripping was also fixed to properly handle `//` sequences inside JSON string values (e.g., URLs like `https://example.com`), using a character-by-character state machine that respects string boundaries.

#### Dependencies

- `yaml` (^2.8) — added to both `@getmcp/cli` and `@getmcp/generators`
- `smol-toml` (^1.6) — added to both `@getmcp/cli` and `@getmcp/generators`

The hand-rolled serializers (`toYaml` in Goose generator, `toToml`/`toTomlValue` in Codex generator) have been replaced with the corresponding library calls for consistency and round-trip correctness.

### Codex Full Integration

The Codex generator (`packages/generators/src/codex.ts`) maps canonical fields to TOML output using the `smol-toml` library. The CLI can now fully read, merge into, and write `~/.codex/config.toml` natively via the multi-format config file support.

#### CLI Read/Write/Merge for TOML — IMPLEMENTED

The CLI's multi-format config file support (see above) enables full `getmcp add` and `getmcp remove` support for Codex's TOML config files.

#### Codex-Specific Config Fields

The canonical format does not include Codex-specific fields. Future work could extend the generator (or add an options/extras mechanism) to support:

- `enabled` (`boolean`) — enable/disable a server without removing it
- `required` (`boolean`) — fail startup if an enabled server can't initialize
- `enabled_tools` (`string[]`) — tool allow list
- `disabled_tools` (`string[]`) — tool deny list (applied after `enabled_tools`)
- `startup_timeout_sec` (`number`) — server startup timeout in seconds
- `tool_timeout_sec` (`number`) — per-tool execution timeout in seconds
- `bearer_token_env_var` (`string`) — env var name for bearer token auth
- `env_vars` (`string[]`) — env var forwarding allow list
- `env_http_headers` (`Record<string, string>`) — HTTP headers whose values are env var names

#### OAuth Support

Codex supports OAuth for remote MCP servers via `codex mcp login <server-name>`. Consider adding guidance or CLI integration for OAuth-authenticated servers, including the optional `mcp_oauth_callback_port` top-level config.

#### Project-Scoped Config

Codex supports project-level config at `.codex/config.toml` (trusted projects only). The CLI's `detectApps()` currently only checks global config paths. Add support for detecting and managing project-scoped config files.

---

## 10. Research Appendix: Config Formats Per App

Detailed documentation of every app's MCP config format, gathered from official documentation.

### Claude Desktop

- **Docs**: https://modelcontextprotocol.io/quickstart/user
- **Config file**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%AppData%\Claude\claude_desktop_config.json` (Windows)
- **Format**:
  ```json
  { "mcpServers": { "name": { "command": "...", "args": [...], "env": {...} } } }
  ```
- Supports stdio transport. Remote servers configured via separate UI.

### Claude Code (CLI)

- **Docs**: https://docs.anthropic.com/en/docs/claude-code/mcp
- **Install**: `claude mcp add --transport <type> <name> [options] -- <command> [args]`
- **Also**: `claude mcp add-json <name> '<json>'`
- **Scopes**: `local` (default, per-project `.mcp.json`), `project` (shared `.mcp.json`), `user` (global `~/.claude.json`)
- **Format**:
  ```json
  { "mcpServers": { "name": { "command": "...", "args": [], "env": {} } } }
  ```
- Supports stdio, http, sse transports.
- Environment variable expansion: `${VAR}` and `${VAR:-default}`.

### VS Code / GitHub Copilot

- **Docs**: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
- **Config file**: `.vscode/mcp.json` (workspace) or user profile `mcp.json`
- **Format** (different root key — `servers`, not `mcpServers`):
  ```json
  {
    "inputs": [...],
    "servers": {
      "name": {
        "type": "stdio",
        "command": "...",
        "args": [...],
        "env": {...},
        "envFile": "..."
      }
    }
  }
  ```
- For HTTP: `{ "type": "http", "url": "...", "headers": {...} }`
- Supports `inputs` array for sensitive data (promptString with password masking).
- Also installable via CLI: `code --add-mcp "{\"name\":\"...\",\"command\":...}"`
- Can auto-discover servers from Claude Desktop config.

### Cursor

- **Docs**: https://docs.cursor.com/context/model-context-protocol
- **Config file**: `.cursor/mcp.json`
- **Format**: Same as Claude Desktop (`mcpServers` root key).
- Supports stdio and SSE transports.

### Cline

- **Docs**: https://docs.cline.bot/mcp-servers/configuring-mcp-servers
- **Config file**: `cline_mcp_settings.json` (in VS Code globalStorage)
- **Format**:
  ```json
  {
    "mcpServers": {
      "name": {
        "command": "...", "args": [...], "env": {...},
        "alwaysAllow": [...],
        "disabled": false
      }
    }
  }
  ```
- For SSE: `{ "url": "...", "headers": {...}, "alwaysAllow": [...], "disabled": false }`
- Extra fields: `alwaysAllow` (string array of auto-approved tools), `disabled` (boolean).

### Roo Code

- **Docs**: https://docs.roocode.com/features/mcp/using-mcp-in-roo
- **Config file**: `mcp_settings.json` (global) / `.roo/mcp.json` (project)
- **Format**:
  ```json
  {
    "mcpServers": {
      "name": {
        "command": "...", "args": [...], "cwd": "...", "env": {...},
        "alwaysAllow": [...], "disabled": false,
        "timeout": 60, "watchPaths": [...], "disabledTools": [...]
      }
    }
  }
  ```
- Remote (Streamable HTTP): `{ "type": "streamable-http", "url": "...", "headers": {...} }`
- Remote (SSE): `{ "type": "sse", "url": "...", "headers": {...} }`
- Extra fields: `alwaysAllow`, `disabled`, `timeout`, `watchPaths`, `disabledTools`, `cwd`.
- Supports `${env:VARIABLE_NAME}` syntax in args.
- Windows requires `cmd /c npx` wrapper.

### Goose

- **Docs**: https://block.github.io/goose/docs/getting-started/using-extensions
- **Config file**: `~/.config/goose/config.yaml` (**YAML**, not JSON)
- **Format**:
  ```yaml
  extensions:
    name:
      name: Display Name
      cmd: npx
      args: [-y, @package/name]
      enabled: true
      envs: { "KEY": "value" }
      type: stdio
      timeout: 300
  ```
- Also supports CLI: `goose configure` (interactive), `goose session --with-extension "command"`
- Supports deeplinks: `goose://extension?cmd=...&arg=...`
- Uses `extensions` key, `cmd` (not `command`), `envs` (not `env`), `timeout` in seconds.

### Windsurf

- **Docs**: https://docs.windsurf.com/windsurf/cascade/mcp
- **Config file**: `~/.codeium/windsurf/mcp_config.json`
- **Format** (stdio):
  ```json
  { "mcpServers": { "name": { "command": "...", "args": [...], "env": {...} } } }
  ```
- **Format** (remote HTTP):
  ```json
  { "mcpServers": { "name": { "serverUrl": "<url>/mcp", "headers": {...} } } }
  ```
- Supports stdio, Streamable HTTP, SSE transports.
- OAuth support.
- Environment variable interpolation: `${env:VARIABLE_NAME}` in `command`, `args`, `env`, `serverUrl`, `url`, `headers`.
- MCP Marketplace with official verified MCPs (blue checkmark).
- Admin whitelist controls for Teams/Enterprise (regex-based matching).
- 100-tool limit per workspace.

### OpenCode

- **Docs**: https://opencode.ai/docs/mcp-servers/
- **Config file**: `opencode.json` / `opencode.jsonc`
- **Format** (local):
  ```json
  {
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
      "name": {
        "type": "local",
        "command": ["npx", "-y", "my-mcp-command"],
        "environment": { "KEY": "value" },
        "enabled": true,
        "timeout": 5000
      }
    }
  }
  ```
- **Format** (remote):
  ```json
  {
    "mcp": {
      "name": {
        "type": "remote",
        "url": "https://...",
        "headers": {...},
        "enabled": true
      }
    }
  }
  ```
- Key differences: root key `mcp`, `command` is an **array** (command+args merged), `environment` (not `env`), `type: "local"|"remote"`, `enabled` field.
- OAuth support with automatic detection, dynamic client registration.
- Env var syntax: `{env:VAR_NAME}` (no `$` prefix).
- CLI: `opencode mcp auth`, `opencode mcp list`, `opencode mcp logout`.
- Per-agent tool management with glob patterns.

### Zed

- **Docs**: https://zed.dev/docs/ai/mcp
- **Config file**: `settings.json` (Zed settings)
- **Format**:
  ```json
  {
    "context_servers": {
      "local-mcp-server": {
        "command": "some-command",
        "args": ["arg-1", "arg-2"],
        "env": {}
      },
      "remote-mcp-server": {
        "url": "custom",
        "headers": { "Authorization": "Bearer <token>" }
      }
    }
  }
  ```
- Root key: `context_servers`.
- Supports Tools and Prompts MCP features.
- Also installable via Zed extensions.
- Tool permissions: granular per-tool via `mcp:<server>:<tool_name>` key format.
- Supports custom agent profiles to control which tools are active.

### PyCharm

- **Docs**: https://www.jetbrains.com/help/ai-assistant/mcp.html
- **Plugin**: [JetBrains AI Assistant](https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant) (required)
- **Config file**: `.ai/mcp/mcp.json` (project-level, cross-platform)
- **Format**:
  ```json
  {
    "mcpServers": {
      "server-name": {
        "command": "npx",
        "args": ["-y", "some-package"],
        "env": {
          "API_KEY": "value"
        }
      },
      "remote-server": {
        "url": "https://mcp.example.com/mcp"
      }
    }
  }
  ```
- Root key: `mcpServers` — identical to Claude Desktop canonical format (pure passthrough).
- Project-level config at `.ai/mcp/mcp.json` is shareable via version control (not in `.idea/`).
- IDE-level state (enable/disable, allowed tools) is stored in `.idea/workspace.xml` under `<component name="McpProjectServerCommands">`, which is gitignored.
- Also configurable globally via IDE Settings → Tools → AI Assistant → Model Context Protocol (MCP), stored in version-specific IDE directories (e.g., `%AppData%\JetBrains\PyCharm2025.3\`).
- Supports stdio, streamable-http, and SSE transports.
- Can import configs from Claude Desktop via the "Import from Claude" button in settings.
- **Important**: PyCharm must be fully closed and reopened for MCP configuration changes to take effect.

### Codex

- **Docs**: https://developers.openai.com/codex/mcp/
- **Config file**: `~/.codex/config.toml` (global), `.codex/config.toml` (project-scoped, trusted projects only)
- **Format** (**TOML**, not JSON):
  ```toml
  [mcp_servers.server-name]
  command = "npx"
  args = ["-y", "@package/name"]

  [mcp_servers.server-name.env]
  API_KEY = "value"
  ```
- **Format** (remote / Streamable HTTP):
  ```toml
  [mcp_servers.remote-server]
  url = "https://mcp.example.com/mcp"
  bearer_token_env_var = "TOKEN_ENV_VAR"

  [mcp_servers.remote-server.http_headers]
  X-Custom-Header = "value"
  ```
- Root key: `mcp_servers` (TOML table prefix).
- Supports stdio and Streamable HTTP transports.
- CLI: `codex mcp add <name> -- <command>`, `codex mcp` for management.
- Shared config between CLI and IDE extension.
- Extra fields (not in canonical): `enabled`, `required`, `enabled_tools`, `disabled_tools`, `startup_timeout_sec`, `tool_timeout_sec`, `bearer_token_env_var`, `env_vars`, `env_http_headers`.
- Other config options: `startup_timeout_sec` (default 10), `tool_timeout_sec` (default 60), `enabled` (default true), `required` (default false).
- OAuth support via `codex mcp login <server-name>`.
- Configurable OAuth callback port: `mcp_oauth_callback_port` (top-level config).
- Environment variable forwarding: `env_vars` (allow list), `env_http_headers` (header values from env vars).

---

## Test Coverage Summary

| Package | Test Files | Tests | Description |
|---------|-----------|-------|-------------|
| `@getmcp/core` | 2 | 30 | Schema validation, type guards, transport inference |
| `@getmcp/generators` | 1 | 63 | All 12 generators (stdio + remote), multi-server, serialization |
| `@getmcp/registry` | 1 | 59 | Entry validation, lookup, search, categories, content integrity |
| `@getmcp/cli` | 2 | 27 | Path resolution, app detection, config read/write/merge/remove |
| **Total** | **6** | **179** | |

---

## Git History

```
01b8fb9 feat: add web directory with server browsing, search, and config generator UI
02a7438 docs: add SPECIFICATION.md with complete project plan and research
83f35e1 feat: add registry with 12 MCP servers and CLI tool for installation
a9133ba feat: scaffold monorepo with core schemas and config generators for 10 AI apps
```

## Publishing

All four library/CLI packages are ready for npm publishing:

- **Package metadata**: name, version, description, license, repository, keywords, engines
- **Exports**: ESM-only (`"type": "module"`), with `exports`, `main`, and `types` fields
- **Files**: Only `dist/`, `README.md`, and `LICENSE` are included in published tarballs
- **CLI bin**: `@getmcp/cli` registers `getmcp` binary via `bin` field
- **Build**: `prepublishOnly` script ensures build runs before publish
- **Workspace deps**: Internal deps use `^0.1.0` version ranges for npm compatibility

### Publish order (respecting dependencies):

```bash
npm publish --workspace=@getmcp/core --access=public
npm publish --workspace=@getmcp/generators --access=public
npm publish --workspace=@getmcp/registry --access=public
npm publish --workspace=@getmcp/cli --access=public
```

### Usage after publishing:

```bash
npx @getmcp/cli add github
npx @getmcp/cli list
npx @getmcp/cli list --search=database
```
