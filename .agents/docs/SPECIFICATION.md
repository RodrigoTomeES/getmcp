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
8. [Web Directory](#8-web-directory)
9. [Future Plans](#9-future-plans)
10. [Research Appendix: Config Formats Per App](#10-research-appendix-config-formats-per-app)

---

## 1. Project Overview

### What is getmcp?

getmcp is a tool that solves a fundamental problem in the AI tooling ecosystem: **every AI application uses a different configuration format for MCP servers**. MCP (Model Context Protocol) is an open protocol that enables LLMs to access custom tools and services, but there is no standard way to configure these servers across different AI apps.

getmcp provides:

- **A canonical configuration format** aligned with [FastMCP](https://github.com/jlowin/fastmcp)'s standard
- **Config generators** that transform the canonical format into 19 app-specific formats
- **A registry** of popular MCP server definitions
- **A CLI tool** for one-command installation into any detected AI app
- **A web directory** for browsing and discovering MCP servers

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

### 19 Apps, 6 Root Keys, 4 Formats

Every major AI application that supports MCP has chosen a slightly (or drastically) different configuration format. Here is the fragmentation landscape:

| App               | Root Key          | Format   | Config Location                                                                                                                | Command Key       | Env Key       | Remote URL Key |
| ----------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ------------- | -------------- |
| Claude Desktop    | `mcpServers`      | JSON     | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%AppData%\Claude\claude_desktop_config.json` (Win) | `command`         | `env`         | —              |
| Claude Code       | `mcpServers`      | JSON     | `.mcp.json` (project), `~/.claude.json` (user)                                                                                 | `command`         | `env`         | `url`          |
| VS Code / Copilot | `servers`         | JSON     | `.vscode/mcp.json`                                                                                                             | `command`         | `env`         | `url`          |
| Cursor            | `mcpServers`      | JSON     | `.cursor/mcp.json`                                                                                                             | `command`         | `env`         | `url`          |
| Cline             | `mcpServers`      | JSON     | `cline_mcp_settings.json`                                                                                                      | `command`         | `env`         | `url`          |
| Roo Code          | `mcpServers`      | JSON     | `mcp_settings.json`, `.roo/mcp.json`                                                                                           | `command`         | `env`         | `url`          |
| Goose             | `extensions`      | **YAML** | `~/.config/goose/config.yaml`                                                                                                  | `cmd`             | `envs`        | `uri`          |
| Windsurf          | `mcpServers`      | JSON     | `~/.codeium/windsurf/mcp_config.json`                                                                                          | `command`         | `env`         | `serverUrl`    |
| OpenCode          | `mcp`             | JSONC    | `opencode.json`                                                                                                                | `command` (array) | `environment` | `url`          |
| Zed               | `context_servers` | JSON     | `settings.json`                                                                                                                | `command`         | `env`         | `url`          |
| PyCharm           | `mcpServers`      | JSON     | `.ai/mcp/mcp.json` (project-level)                                                                                             | `command`         | `env`         | `url`          |

### Key Fragmentation Dimensions

| Dimension             | Variations Found                                                                      |
| --------------------- | ------------------------------------------------------------------------------------- |
| Root key              | `mcpServers`, `servers`, `extensions`, `mcp`, `context_servers`                       |
| Config format         | JSON, JSONC, YAML                                                                     |
| Command key           | `command` (string) vs `cmd` (string) vs `command` (array with args merged)            |
| Env key               | `env` vs `envs` vs `environment`                                                      |
| Remote URL key        | `url` vs `serverUrl` vs `uri`                                                         |
| Transport declaration | Implicit (most) vs `type` field (VS Code, Roo Code) vs `transport` field              |
| Extra fields          | `alwaysAllow`, `disabled`, `timeout`, `watchPaths`, `disabledTools`, `cwd`, `enabled` |
| Env var syntax        | Direct values, `${VAR}`, `${VAR:-default}`, `${env:VAR}`, `{env:VAR}`                 |
| Windows handling      | Some need `cmd /c` wrapper                                                            |
| Install method        | File edit, CLI commands, UI, extensions, marketplace                                  |

---

## 3. Architecture

### Monorepo Structure

```
getmcp/
  package.json                     # Root workspace config
  tsconfig.json                    # Shared TypeScript settings
  .agents/docs/SPECIFICATION.md    # This file
  packages/
    core/                          # @getmcp/core (v0.1.0)
      src/
        schemas.ts                 # Zod validation schemas
        types.ts                   # TypeScript types (inferred from Zod)
        utils.ts                   # Type guards + transport inference
        index.ts                   # Public API barrel
      tests/
        schemas.test.ts            # Schema validation tests
        utils.test.ts              # Type guard and transport inference tests
        json-schema.test.ts        # JSON Schema generation tests

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
        pycharm.ts                 # Generator for PyCharm
        codex.ts                   # Generator for Codex (TOML)
        gemini-cli.ts              # Generator for Gemini CLI
        continue.ts                # Generator for Continue
        amazon-q.ts                # Generator for Amazon Q
        trae.ts                    # Generator for Trae
        bolt-ai.ts                 # Generator for BoltAI
        libre-chat.ts              # Generator for LibreChat (YAML)
        antigravity.ts             # Generator for Google Antigravity
        index.ts                   # Generator registry + public API
      tests/
        generators.test.ts         # 113 tests

    registry/                      # @getmcp/registry
      servers/                     # 106 JSON server definition files
        github.json
        filesystem.json
        brave-search.json
        ...
      src/
        index.ts                   # Registry API (search, filter, lookup)
      scripts/
        validate-servers.js        # Build-time Zod validation
        copy-servers.js            # Copies servers/*.json → dist/servers/
      tests/
        registry.test.ts

    cli/                           # @getmcp/cli (v0.1.0)
      src/
        bin.ts                     # CLI entry point (getmcp command)
        detect.ts                  # App auto-detection
        config-file.ts             # Config read/write/merge operations
        lock.ts                    # Installation tracking via getmcp-lock.json
        errors.ts                  # Error types and formatting
        utils.ts                   # Flag parsing, alias resolution, path shortening
        preferences.ts             # Global user preferences persistence
        format.ts                  # Config format detection from file extension
        commands/
          add.ts                   # getmcp add [server-id]
          remove.ts                # getmcp remove [server-name]
          list.ts                  # getmcp list [options]
          find.ts                  # getmcp find [query] (aliases: search, s, f)
          check.ts                 # getmcp check
          update.ts                # getmcp update [options]
          init.ts                  # getmcp init
          doctor.ts                # getmcp doctor (health diagnostics)
          import.ts                # getmcp import (adopt existing servers)
          sync.ts                  # getmcp sync (project manifest)
        index.ts                   # Public API barrel
      tests/
        detect.test.ts             # 14 tests
        config-file.test.ts        # 60 tests
        lock.test.ts               # 23 tests (includes per-app scope tracking tests)
        errors.test.ts             # 25 tests
        utils.test.ts              # 43 tests (parseFlags + resolveAlias + shortenPath)
        preferences.test.ts        # 21 tests
        format.test.ts             # 8 tests
        bin.test.ts                # 22 tests (flag parsing and alias tests)
        app-selection.test.ts      # 9 tests (resolveAppsFromFlags + resolveScope)
        commands/
          add.test.ts              # 13 tests
          remove.test.ts           # 9 tests
          list.test.ts             # 12 tests (JSON/quiet output modes)
          find.test.ts             # 3 tests
          check.test.ts            # 10 tests (includes per-app scope verification)
          update.test.ts           # 7 tests
          doctor.test.ts           # 5 tests
          import.test.ts           # 5 tests
          init.test.ts             # 3 tests
          sync.test.ts             # 7 tests
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

This means our canonical format is directly compatible with the most widely-used MCP framework. Our generators then transform _from_ this standard _to_ each app's specific format.

---

## 4. Canonical Schema

### StdioServerConfig

For servers that run as local processes via stdio transport.

| Field         | Type                     | Required | Default   | Description                                         |
| ------------- | ------------------------ | -------- | --------- | --------------------------------------------------- |
| `command`     | `string`                 | Yes      | —         | The executable (e.g., `"npx"`, `"uvx"`, `"docker"`) |
| `args`        | `string[]`               | No       | `[]`      | Arguments passed to the command                     |
| `env`         | `Record<string, string>` | No       | `{}`      | Environment variables                               |
| `transport`   | `"stdio"`                | No       | `"stdio"` | Transport type (always stdio)                       |
| `cwd`         | `string`                 | No       | —         | Working directory for execution                     |
| `timeout`     | `number`                 | No       | —         | Max response time in milliseconds                   |
| `description` | `string`                 | No       | —         | Human-readable description                          |

### RemoteServerConfig

For servers accessible via HTTP, Streamable HTTP, or SSE.

| Field         | Type                                   | Required | Default  | Description                                       |
| ------------- | -------------------------------------- | -------- | -------- | ------------------------------------------------- |
| `url`         | `string` (URL)                         | Yes      | —        | The server URL                                    |
| `transport`   | `"http" \| "streamable-http" \| "sse"` | No       | Inferred | Transport type (auto-inferred from URL if absent) |
| `headers`     | `Record<string, string>`               | No       | `{}`     | HTTP headers                                      |
| `timeout`     | `number`                               | No       | —        | Max response time in milliseconds                 |
| `description` | `string`                               | No       | —        | Human-readable description                        |

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

| Field             | Type                                         | Required | Description                                                       |
| ----------------- | -------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `id`              | `string`                                     | Yes      | Unique ID, lowercase alphanumeric with hyphens (e.g., `"github"`) |
| `name`            | `string`                                     | Yes      | Display name (e.g., `"GitHub"`)                                   |
| `description`     | `string`                                     | Yes      | What the server does                                              |
| `config`          | `StdioServerConfig \| RemoteServerConfig`    | Yes      | The canonical server configuration                                |
| `package`         | `string`                                     | No       | npm/pypi package name                                             |
| `runtime`         | `"node" \| "python" \| "docker" \| "binary"` | No       | Execution runtime                                                 |
| `repository`      | `string` (URL)                               | No       | Source code URL                                                   |
| `homepage`        | `string` (URL)                               | No       | Homepage URL                                                      |
| `author`          | `string`                                     | No       | Author or organization                                            |
| `categories`      | `string[]`                                   | No       | Discovery categories                                              |
| `requiredEnvVars` | `string[]`                                   | No       | Env vars the user must provide                                    |
| `windows`         | `PlatformOverride`                           | No       | Windows-specific command overrides                                |
| `linux`           | `PlatformOverride`                           | No       | Linux-specific command overrides                                  |
| `macos`           | `PlatformOverride`                           | No       | macOS-specific command overrides                                  |

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
  | "pycharm"
  | "codex"
  | "gemini-cli"
  | "continue"
  | "amazon-q"
  | "trae"
  | "bolt-ai"
  | "libre-chat"
  | "antigravity";
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
  detectInstalled(): boolean;
}
```

### Installation Detection

Each generator implements `detectInstalled()` to check if the app is present on the current system using `existsSync()` on platform-specific directories. `BaseGenerator` provides a default implementation returning `false`.

Shared path constants are exported from `packages/generators/src/base.ts`:

| Constant       | Value                                | Env Override        |
| -------------- | ------------------------------------ | ------------------- |
| `home`         | `os.homedir()`                       | —                   |
| `configHome`   | `$XDG_CONFIG_HOME` or `~/.config`    | `XDG_CONFIG_HOME`   |
| `appData`      | `$APPDATA` or `~/AppData/Roaming`    | `APPDATA`           |
| `localAppData` | `$LOCALAPPDATA` or `~/AppData/Local` | `LOCALAPPDATA`      |
| `claudeHome`   | `$CLAUDE_CONFIG_DIR` or `~/.claude`  | `CLAUDE_CONFIG_DIR` |
| `codexHome`    | `$CODEX_HOME` or `~/.codex`          | `CODEX_HOME`        |

Apps that cannot be reliably detected (PyCharm, LibreChat) use the default `false`.

### AppMetadata

Each generator's `app` property describes the target AI application:

```typescript
interface AppMetadata {
  id: AppId;
  name: string;
  description: string;
  /** Project-scoped config path (relative, same on all platforms). null if no project scope. */
  configPaths: string | null;
  /** Global config paths (platform-specific). null if no global scope. */
  globalConfigPaths: PlatformPaths | null;
  configFormat: "json" | "jsonc" | "yaml" | "toml";
  docsUrl: string;
}
```

**Scope utilities** (exported from `@getmcp/core`):

- `supportsBothScopes(app: AppMetadata): boolean` — returns `true` when an app has both `configPaths` and `globalConfigPaths` set (i.e., supports both project and global scopes).
- `getDefaultScope(app: AppMetadata): "project" | "global"` — returns `"project"` when the app has a project-scoped path, otherwise `"global"`.

**Dual-scope apps** (support both project and global config): Claude Code, Cursor, Codex. All other apps are either project-only or global-only.

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

#### Antigravity — `AntigravityGenerator`

- **Passthrough**: canonical format IS the native format
- Root key: `mcpServers`
- Config path: `~/.gemini/antigravity/mcp_config.json` (macOS/Linux), `%UserProfile%\.gemini\antigravity\mcp_config.json` (Windows)
- Omits empty `args` and `env`

### Transformation Summary Table

| App            | Root Key          | `command`         | `args`   | `env`         | Remote URL     | Extra Fields                               | Format |
| -------------- | ----------------- | ----------------- | -------- | ------------- | -------------- | ------------------------------------------ | ------ |
| Claude Desktop | `mcpServers`      | `command`         | `args`   | `env`         | `url`          | —                                          | JSON   |
| Claude Code    | `mcpServers`      | `command`         | `args`   | `env`         | `url` + `type` | —                                          | JSON   |
| VS Code        | `servers`         | `command`         | `args`   | `env`         | `url` + `type` | `type` on all                              | JSON   |
| Cursor         | `mcpServers`      | `command`         | `args`   | `env`         | `url`          | —                                          | JSON   |
| Cline          | `mcpServers`      | `command`         | `args`   | `env`         | `url`          | `alwaysAllow`, `disabled`                  | JSON   |
| Roo Code       | `mcpServers`      | `command`         | `args`   | `env`         | `url` + `type` | `alwaysAllow`, `disabled`                  | JSON   |
| Goose          | `extensions`      | `cmd`             | `args`   | `envs`        | `uri`          | `name`, `enabled`, `type`, `timeout` (sec) | YAML   |
| Windsurf       | `mcpServers`      | `command`         | `args`   | `env`         | `serverUrl`    | —                                          | JSON   |
| OpenCode       | `mcp`             | `command` (array) | (merged) | `environment` | `url` + `type` | `type`, `enabled`                          | JSONC  |
| Zed            | `context_servers` | `command`         | `args`   | `env`         | `url`          | —                                          | JSON   |
| PyCharm        | `mcpServers`      | `command`         | `args`   | `env`         | `url`          | —                                          | JSON   |
| Antigravity    | `mcpServers`      | `command`         | `args`   | `env`         | `url`          | —                                          | JSON   |

---

## 6. Registry

### Built-in Servers (106)

| #   | ID                    | Name                | Transport     | Runtime | Required Env Vars                  | Categories                                  |
| --- | --------------------- | ------------------- | ------------- | ------- | ---------------------------------- | ------------------------------------------- |
| 1   | `brave-search`        | Brave Search        | stdio         | node    | `BRAVE_API_KEY`                    | search, web                                 |
| 2   | `context7`            | Context7            | remote (HTTP) | node    | —                                  | documentation, search, developer-tools      |
| 3   | `fetch`               | Fetch               | stdio         | python  | —                                  | web, utilities                              |
| 4   | `filesystem`          | Filesystem          | stdio         | node    | —                                  | filesystem, utilities                       |
| 5   | `github`              | GitHub              | stdio         | node    | `GITHUB_PERSONAL_ACCESS_TOKEN`     | developer-tools, git, version-control       |
| 6   | `google-maps`         | Google Maps         | stdio         | node    | `GOOGLE_MAPS_API_KEY`              | maps, location, utilities                   |
| 7   | `memory`              | Memory              | stdio         | node    | —                                  | memory, knowledge-graph                     |
| 8   | `postgres`            | PostgreSQL          | stdio         | node    | `POSTGRES_CONNECTION_STRING`       | database, sql                               |
| 9   | `puppeteer`           | Puppeteer           | stdio         | node    | —                                  | browser, automation, web-scraping           |
| 10  | `sequential-thinking` | Sequential Thinking | stdio         | node    | —                                  | reasoning, utilities                        |
| 11  | `sentry`              | Sentry              | remote (SSE)  | node    | —                                  | monitoring, error-tracking, developer-tools |
| 12  | `slack`               | Slack               | stdio         | node    | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` | communication, messaging                    |

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
findServerByCommand(command: string, args: string[]): RegistryEntry | undefined
```

**Search** matches against: id, name, description, categories, and author (case-insensitive).

### Adding a New Server

1. Create a JSON file at `packages/registry/servers/<id>.json`
2. Run tests: `npx vitest run packages/registry`

The registry auto-discovers all `.json` files in `servers/`. No manual imports or registration needed.

Example:

```json
{
  "$schema": "https://getmcp.es/registry-entry.schema.json",
  "id": "my-server",
  "name": "My Server",
  "description": "Description of what this server does",
  "config": {
    "command": "npx",
    "args": ["-y", "@my/mcp-server"],
    "env": { "API_KEY": "" },
    "transport": "stdio"
  },
  "package": "@my/mcp-server",
  "runtime": "node",
  "categories": ["category"],
  "requiredEnvVars": ["API_KEY"]
}
```

The `$schema` field enables autocompletion and validation in your editor. All entries are validated against the `RegistryEntry` Zod schema at build time.

---

## 7. CLI Tool

### Installation

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
6. For dual-scope apps (Claude Code, Cursor, Codex): prompts for project vs global scope (or uses `--global`/`--project` flag)
7. Generates app-specific config for each selected app
8. Merges into existing config files (preserves all existing servers)
9. Reports success per app

| Flag        | Short | Description                                             |
| ----------- | ----- | ------------------------------------------------------- |
| `--global`  | `-g`  | Install to global config for dual-scope apps            |
| `--project` |       | Install to project config for dual-scope apps (default) |

#### `getmcp remove [server-name]`

1. If no server name provided: shows interactive picker of all configured servers across all apps (non-interactive mode exits with error)
2. Scans all detected apps for the named server
3. Shows which apps have it configured
4. User selects which apps to remove from (or all)
5. Confirms removal
6. Removes the server entry from each selected config
7. Reports results

| Flag        | Short | Description                               |
| ----------- | ----- | ----------------------------------------- |
| `--yes`     | `-y`  | Skip confirmation prompts                 |
| `--dry-run` |       | Preview changes without writing files     |
| `--global`  | `-g`  | Target global config for dual-scope apps  |
| `--project` |       | Target project config for dual-scope apps |

#### `getmcp list [options]`

| Option             | Description                              |
| ------------------ | ---------------------------------------- |
| (none)             | List all servers in registry             |
| `--installed`      | List servers configured in detected apps |
| `--search=<query>` | Search the registry                      |
| `--category=<cat>` | Filter by category                       |

#### `getmcp find [query]`

Interactive fuzzy search through the registry. After selecting a server, jumps directly into the `add` flow.

- **Aliases**: `search`, `s`, `f`
- If a query argument is provided, results are filtered immediately
- If no query, prompts for a search term (or shows all servers if left empty)
- Displays transport type, env var count, and categories alongside each result

#### `getmcp check`

Compares the lock file against the current registry and app configs to detect drift:

1. Reads all tracked installations from `getmcp-lock.json`
2. For each tracked server, verifies it still exists in the registry
3. For each tracked app, resolves the correct config path using the per-app scope from `scopes` (global-scoped apps check the global config path, project-scoped apps check the project config path)
4. Verifies the server is still present in each app's resolved config file
5. Reports issues: servers removed from registry, servers removed from app configs, apps no longer detected

#### `getmcp update [options]`

Re-generates and merges configs for all tracked installations using the current registry definitions.

| Option        | Description                                         |
| ------------- | --------------------------------------------------- |
| `--yes`, `-y` | Skip confirmation prompts                           |
| `--app <id>`  | Only update configs for a specific app (repeatable) |
| `--all-apps`  | Update across all detected apps                     |
| `--dry-run`   | Preview generated configs without writing files     |

#### `getmcp init`

Interactive wizard to scaffold a new MCP server registry entry. Prompts for:

1. Server ID, display name, description
2. Transport type (stdio, http, streamable-http, sse)
3. Command and args (stdio) or URL (remote)
4. Required environment variables
5. Categories, runtime, repository, author

Generates a JSON file at `packages/registry/servers/<id>.json` with `$schema` for editor autocompletion.

#### `getmcp doctor`

Health diagnostics for your MCP setup. Checks:

1. Detect all installed apps and report status
2. Parse each app's config file (detect syntax errors)
3. Check if configured servers are still in registry
4. Check for orphaned servers (in config but not in lock file)
5. Verify required env vars are set
6. Check runtime dependencies (Node.js, npx, uvx)

| Option   | Description            |
| -------- | ---------------------- |
| `--json` | Output structured JSON |

**Aliases**: `dr`

#### `getmcp import`

Scan existing app configs and adopt configured servers into getmcp tracking.

1. Scans all detected apps for configured servers
2. Cross-references with registry (match by ID, package name, or command)
3. Shows: matched (in registry) vs unmatched (unknown)
4. User selects which to adopt
5. Adds to lock file tracking

| Option        | Description             |
| ------------- | ----------------------- |
| `--yes`, `-y` | Auto-import all matched |
| `--json`      | Output structured JSON  |

#### `getmcp sync`

Read a `getmcp.json` project manifest and install all declared servers.

```bash
getmcp sync -y --all-apps
```

| Option        | Description                              |
| ------------- | ---------------------------------------- |
| `--yes`, `-y` | Skip confirmation prompts                |
| `--app <id>`  | Only sync to a specific app (repeatable) |
| `--all-apps`  | Sync across all detected apps            |
| `--dry-run`   | Preview changes without writing files    |
| `--json`      | Output structured JSON                   |

##### ProjectManifest Schema (`getmcp.json`)

```json
{
  "servers": {
    "github": {},
    "brave-search": { "env": { "BRAVE_API_KEY": "my-key" } },
    "memory": { "apps": ["claude-desktop", "vscode"] },
    "filesystem": { "scope": "global" }
  }
}
```

Each server entry can optionally specify `env` overrides, `apps` restrictions, and `scope` (`"project"` or `"global"`) for dual-scope apps.

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

#### DetectedApp Interface

```typescript
interface DetectedApp {
  id: AppIdType;
  name: string;
  configPath: string; // Resolved default config path
  exists: boolean; // Whether the app is installed
  supportsBothScopes: boolean; // true for Claude Code, Cursor, Codex
  globalConfigPath?: string; // Present only for dual-scope apps
}
```

For dual-scope apps, `configPath` defaults to the project-scoped path. When the user selects global scope (via `--global` flag or interactive prompt), the CLI uses `resolveAppForScope()` to swap to the `globalConfigPath`.

### Scope Selection

Three apps support both project and global config scopes: **Claude Code**, **Cursor**, and **Codex**.

| Flag        | Short | Effect                                                  |
| ----------- | ----- | ------------------------------------------------------- |
| `--global`  | `-g`  | Install to global config for dual-scope apps            |
| `--project` |       | Install to project config for dual-scope apps (default) |

When neither flag is provided and dual-scope apps are selected, the CLI prompts the user to choose a scope interactively. Single-scope apps ignore these flags.

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

### Installation Tracking

The CLI tracks installations via a project-level lock file at `./getmcp-lock.json`. This file is auto-created by `add` and `remove`, and can be committed to version control for team sharing (similar to `package-lock.json`).

#### Lock File Schema

```typescript
interface LockFile {
  version: 1;
  installations: Record<string, LockInstallation>;
}

interface LockInstallation {
  apps: AppIdType[]; // App IDs this server is installed in
  installedAt: string; // ISO timestamp of initial installation
  updatedAt: string; // ISO timestamp of last update
  envVars: string[]; // Env var names that were set (values NOT stored for security)
  scopes?: Record<string, "project" | "global">; // Per-app installation scope (missing = "project")
}
```

The `scopes` field tracks the installation scope for each app independently. This is necessary because a single server can be installed at different scopes for different apps (e.g., `claude-desktop` is always project-scoped, while `claude-code` may be installed globally). When `scopes` is absent or an app has no entry, the scope defaults to `"project"` for backwards compatibility.

#### Lock File Operations

```typescript
getLockFilePath(): string                                                       // Resolves to ./getmcp-lock.json
readLockFile(filePath?: string): LockFile                                       // Read lock file (returns empty default if missing)
writeLockFile(lock: LockFile, filePath?: string): void                          // Write lock file
trackInstallation(serverId, appIds, envVarNames, filePath?, scopes?): void      // Record an installation (merges apps/envVars/scopes if existing)
trackRemoval(serverId, appIds, filePath?): void                                 // Record a removal (cleans up scopes, deletes entry if no apps remain)
getTrackedServers(filePath?: string): LockFile                                  // Get all tracked installations
```

#### Usage by Commands

| Command  | Lock File Interaction                                                                    |
| -------- | ---------------------------------------------------------------------------------------- |
| `add`    | Calls `trackInstallation()` with per-app scopes after successfully writing configs       |
| `remove` | Calls `trackRemoval()` after successfully removing configs (cleans up per-app scopes)    |
| `check`  | Reads lock file, uses per-app scopes to resolve correct config paths for verification    |
| `update` | Reads lock file, re-generates configs for all tracked servers, preserves existing scopes |
| `import` | Calls `trackInstallation()` with `"project"` scope for all discovered apps               |
| `sync`   | Calls `trackInstallation()` with per-app scopes derived from manifest or CLI flags       |

---

## 8. Web Directory

### Overview

A Next.js website that serves as a public directory for MCP servers. Think "npm registry for MCP servers" with one-click config generation.

**Tech stack**: Next.js 15.3+ (App Router), Tailwind CSS 4.0+, Vercel Analytics + Speed Insights, with `@getmcp/core`, `@getmcp/generators`, and `@getmcp/registry` imported directly. Server pages are statically generated from the registry.

### Routes

The web application provides the following public routes:

| Route              | Purpose                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| `/`                | Homepage with hero section, search, and recent servers                         |
| `/docs`            | Documentation page (getting started, supported apps, library usage)            |
| `/servers`         | Server directory index page with search and category/runtime/transport filters |
| `/servers/[id]`    | Individual server detail page with config generators for all 19 apps           |
| `/category/[slug]` | 14 category landing pages with per-category server grids and descriptions      |
| `/guides/[app]`    | 19 app-specific MCP setup guides (config details, examples, troubleshooting)   |

### JSON-LD Schemas

The site uses structured data (JSON-LD) for SEO and schema.org compliance:

- **BreadcrumbList** — Category and guide navigation breadcrumbs
- **CollectionPage** — Server directory index (`/servers`)
- **ItemList** — Category server grids (`/category/[slug]`)
- **TechArticle** — App-specific guides (`/guides/[app]`)
- **SoftwareApplication** (fixed) — Organization schema in root layout
- **WebApplication** — Root application metadata
- **Organization** — getmcp organization metadata

All schemas include proper `@context`, `@type`, and required properties per schema.org specification.

---

## 9. Future Plans

All planned features, improvements, and future work are tracked in [`ROADMAP.md`](./ROADMAP.md). This includes:

- New AI app support (JetBrains AI broad support, LM Studio)
- Registry enhancements (version tracking, compatibility matrix)
- Codex-specific enhancements (extra config fields, OAuth, project-scoped config)
- CLI improvements (fuzzy matching in remove, error recovery/rollback)

See ROADMAP.md for the complete list with priorities, status, and implementation notes.

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

| Package              | Test Files | Tests   | Description                                                                                                          |
| -------------------- | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `@getmcp/core`       | 3          | 39      | Schema validation, type guards, transport inference, JSON Schema, ProjectManifest                                    |
| `@getmcp/generators` | 1          | 119     | All 19 generators (stdio + remote), multi-server, serialization                                                      |
| `@getmcp/registry`   | 1          | 60      | Entry validation, lookup, search, categories, content integrity                                                      |
| `@getmcp/cli`        | 12         | 297     | Path resolution, app detection, config I/O, lock file, errors, preferences, utils, flags, doctor, import, sync, list |
| **Total**            | **17**     | **515** |                                                                                                                      |

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
