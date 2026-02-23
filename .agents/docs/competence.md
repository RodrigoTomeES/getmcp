# Competitive Analysis — getmcp

> Last updated: 2026-02-22

---

## Landscape Overview

|                    | **mcp-get**                                                       | **MCPHub**                                                                | **Smithery**                                          | **mcpm.sh**                                                                         | **getmcp**                                                      |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Repo**           | [michaellatman/mcp-get](https://github.com/michaellatman/mcp-get) | [lightconetech/mcp-gateway](https://github.com/lightconetech/mcp-gateway) | [smithery-ai/cli](https://github.com/smithery-ai/cli) | [pathintegral-institute/mcpm.sh](https://github.com/pathintegral-institute/mcpm.sh) | [RodrigoTomeES/getmcp](https://github.com/RodrigoTomeES/getmcp) |
| **Status**         | Deprecated                                                        | Abandoned                                                                 | Active (commercial)                                   | Active (OSS)                                                                        | New (5 days old)                                                |
| **Stars**          | 506                                                               | 151                                                                       | 509                                                   | 892                                                                                 | 0                                                               |
| **Clients**        | 1                                                                 | 1                                                                         | 19                                                    | 14                                                                                  | 12                                                              |
| **Registry**       | ~79                                                               | 40 (closed)                                                               | 100K+ (cloud API)                                     | 379                                                                                 | 35                                                              |
| **Architecture**   | Monolithic                                                        | Cloud proxy                                                               | Cloud proxy                                           | Runtime proxy                                                                       | Config generator                                                |
| **Offline**        | Yes                                                               | No                                                                        | No                                                    | Yes                                                                                 | Yes                                                             |
| **Auth required**  | No                                                                | No                                                                        | Yes (OAuth)                                           | No                                                                                  | No                                                              |
| **License**        | MIT                                                               | Apache 2.0                                                                | **AGPL-3.0**                                          | MIT                                                                                 | MIT                                                             |
| **Runtime dep**    | No                                                                | Yes                                                                       | Yes                                                   | **Yes**                                                                             | **No**                                                          |
| **Library reuse**  | No                                                                | No                                                                        | No                                                    | No                                                                                  | **Yes**                                                         |
| **Language**       | TypeScript                                                        | TypeScript                                                                | TypeScript                                            | Python                                                                              | TypeScript                                                      |
| **Config formats** | JSON                                                              | JSON                                                                      | JSON, JSONC, YAML                                     | JSON, YAML                                                                          | JSON, JSONC, YAML, TOML                                         |
| **Tests**          | Jest                                                              | 0                                                                         | Vitest                                                | pytest                                                                              | Vitest (335 tests)                                              |

---

## 1. mcp-get (DEPRECATED)

**Repo**: https://github.com/michaellatman/mcp-get
**npm**: `@michaellatman/mcp-get` — ~207/week downloads (declining)
**Created**: November 27, 2024 | **Last commit**: November 9, 2025

### What It Does

One of the earliest MCP package managers. `npx @michaellatman/mcp-get install <package>` configures a server into Claude Desktop's config automatically. As of v1.0.116, the entry point prints a deprecation notice redirecting users to Smithery.

### CLI Commands (5)

| Command                       | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `list`                        | Browse all packages with fuzzy autocomplete, select to install |
| `install <package> [version]` | Install a server by name                                       |
| `uninstall [package]`         | Remove from Claude Desktop config                              |
| `installed`                   | List currently installed servers                               |
| `update`                      | Self-update mcp-get itself (NOT installed servers)             |

**Flags**: `--ci` (skip prompts), `--restart-claude` (restart Claude Desktop after changes)

### Supported Apps

**Only Claude Desktop.** Hardcoded config paths:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

No generator system, no multi-app support. Issue #82 requested IDE support — never addressed.

### Registry

- ~79 JSON files in `packages/` directory, bundled inside the npm package
- Fields: name, description, vendor, sourceUrl, homepage, license, runtime, environmentVariables
- No Zod validation, no categories, no structured author field
- Env vars defined in BOTH registry JSON files AND hardcoded in `src/helpers/index.ts` (dual source of truth)
- Search: text-based (name, description, vendor match)

### Strengths

1. **First-mover advantage** — created weeks after MCP announcement, 506 stars
2. **Simple UX** — single `npx install` command for Claude Desktop
3. **Unverified package support** — can install packages not in registry by prompting for runtime type
4. **Runtime detection** — checks for `uvx`, offers to install UV if missing
5. **Claude Desktop restart integration** — detects running process, offers restart
6. **CI mode** — `--ci` flag for automation
7. **Fuzzy search** — `inquirer-autocomplete-prompt` with `fuzzy` matching
8. **Version pinning** — supports specific versions across Node/Python/Go
9. **Low contribution barrier** — just create a JSON file and PR

### Weaknesses

1. **DEPRECATED AND ABANDONED** — directs users to Smithery, 3+ months no updates
2. **Single app support** — only Claude Desktop
3. **No config format abstraction** — hardcoded JSON, single path
4. **No generator architecture** — structurally impossible to add new apps without rewrite
5. **Dual source of truth for env vars**
6. **No schema validation** — plain `JSON.parse()`, no Zod
7. **No lock file / installation tracking**
8. **`update` only updates mcp-get itself** — cannot update installed servers
9. **No canonical format** — generates from runtime type directly
10. **No remote/SSE server support** — stdio only
11. **Analytics tracking** — sends pings to `mcp-get.com` (privacy concern, may stop working)
12. **TypeScript 4.x** — outdated

### Strategic Takeaway

506 stars of orphaned users told "go use Smithery." Many won't want AGPL/vendor lock-in. **Position getmcp as the open-source successor.**

---

## 2. MCPHub / mcp-gateway (ABANDONED)

**Repo**: https://github.com/lightconetech/mcp-gateway
**npm**: `@mcphub/gateway` — ~156/month downloads
**Created**: December 5, 2024 | **Last commit**: December 8, 2024 (14+ months ago)

### What It Does

A **protocol translation gateway** (not a config generator). Bridges Claude Desktop's stdio MCP communication to remote HTTP/SSE-based MCP servers. Acts as middleware proxy:

1. Accepts stdio from Claude Desktop
2. Forwards to `https://server.mcphub.ai/api/mcp`
3. Converts SSE responses back to stdio

The real product is the hosted platform at mcphub.ai (40 curated servers in 12 categories). The open-source repo is a thin client.

### CLI Commands

**None.** Single binary entry point (`mcphub-gateway`) that starts the proxy process. No add/remove/list/search/init. Only config: `MCPHUB_SERVER_URL` env var.

### Supported Apps

**Only Claude Desktop.** Manual config editing required.

### Strengths

1. Simple stdio-to-SSE bridge concept
2. Curated 40-server directory with verification badges
3. Natural language discovery (ask Claude to search for servers)
4. Apache 2.0 license

### Weaknesses

1. **Abandoned** — 4 total commits, all within 3 days of creation
2. **Single app, no CLI, no config generation**
3. **Centralized dependency** — if `server.mcphub.ai` goes down, everything breaks (issue #2 reports this)
4. **Documentation bugs** — README says `MCP_SERVER_URL`, code uses `MCPHUB_SERVER_URL` (2 PRs trying to fix, both unmerged for 9+ months)
5. **Zero tests, no CI, no linting**
6. **Closed registry** — can't inspect or contribute server definitions
7. **Security concern** — all MCP traffic routes through third-party cloud
8. **Runtime proxy overhead** — extra hop adds latency

### Strategic Takeaway

Not a real competitor. Useful only as a reference for the stdio-to-SSE bridge pattern.

---

## 3. Smithery CLI (MAIN COMMERCIAL COMPETITOR)

**Repo**: https://github.com/smithery-ai/cli
**npm**: `@smithery/cli` v4.0.2
**Created**: December 22, 2024 | **Last release**: February 17, 2026

### What It Does

Cloud-first platform for discovering, connecting to, and managing MCP servers and "skills." When you "install" a server via Smithery, the client config often points to `https://server.smithery.ai/<namespace>/<server>/mcp` — traffic flows through their infrastructure.

### CLI Commands (~25+)

**MCP Server Management:**

| Command                                  | Description                              |
| ---------------------------------------- | ---------------------------------------- |
| `mcp search [term]`                      | Search the Smithery registry             |
| `mcp add <url>`                          | Create connection (via Smithery proxy)   |
| `mcp list`                               | List active connections                  |
| `mcp remove <ids...>`                    | Remove connections                       |
| `mcp get <id>`                           | Get connection details                   |
| `mcp update <id>`                        | Update connection                        |
| `mcp install <server> --client <name>`   | Install into specific client config      |
| `mcp uninstall <server> --client <name>` | Remove from client config                |
| `mcp publish <url> -n <org/server>`      | Publish server to registry               |
| `mcp deploy`                             | Deploy server to Smithery infrastructure |
| `mcp dev`                                | Local dev with hot reload + ngrok tunnel |

**Tool Interaction (unique to Smithery):**

| Command                          | Description                       |
| -------------------------------- | --------------------------------- |
| `tool list [connection]`         | List tools from connected servers |
| `tool find [query]`              | Fuzzy search tools                |
| `tool get <conn> <tool>`         | Get tool schema                   |
| `tool call <conn> <tool> [args]` | Execute tool from CLI             |

**Skills, Auth, Namespaces:**

- `skill search/add/upvote/downvote/review`
- `auth login/logout/whoami/token`
- `namespace list/use/create`

**Global flags**: `--json`, `--table`, `--verbose`, `--debug`

### Supported Apps (19)

**Command-based (5):** Claude Code, VS Code, VS Code Insiders, Gemini CLI, Codex

**File-based (14):** Claude Desktop, Cursor, Cline, Roo Code, Windsurf, Goose, OpenCode, Witsy, Enconvo, BoltAI, Amazon Bedrock, Amazon Q, Tome, LibreChat

**Skill agents (38):** Continue, GitHub Copilot, OpenHands, Junie, Amp, Augment, Kilo Code, Kiro CLI, Qwen Code, Replit, Trae, etc.

**Clients Smithery has that getmcp doesn't**: Witsy, Enconvo, BoltAI, Amazon Bedrock, Amazon Q, Tome, LibreChat, Gemini CLI, Codex, VS Code Insiders

**Clients getmcp has that Smithery doesn't**: Zed, PyCharm

### Registry

- Centralized API at `smithery.ai` via `@smithery/api` SDK
- Claims "100K+ skills and thousands of MCPs"
- Namespaced (e.g., `@upstash/context7-mcp`)
- Use counts, verified badges
- Anyone can publish via `smithery mcp deploy` or `smithery mcp publish <url>`
- **Requires network access** — no offline capability

### Tech Stack

TypeScript, Node >= 20, pnpm, Commander.js, Zod v3/v4, jsonc-parser, yaml, FlexSearch, Inquirer.js, Biome, Vitest, esbuild, ~25+ deps (including @anthropic-ai/mcpb, @ngrok/ngrok, miniflare, keytar, @smithery/api)

### Strengths

1. **Massive registry** — 100K+ servers, API-driven, dynamic growth
2. **Tool calling from CLI** — `tool call` for testing/automation (unique)
3. **Server hosting** — `deploy` to Cloudflare Workers infrastructure
4. **Dev mode** — hot reload + ngrok tunneling + Miniflare
5. **OAuth support** — handles auth flows for servers requiring it
6. **Skills ecosystem** — social layer with reviews, votes
7. **Agent-friendly output** — `--json`/`--table`, SKILL.md for AI agents
8. **Broadest client support** — 19 clients
9. **Active development** — v4.0 in 14 months, releases every few days
10. **Command-based installation** — invokes client CLIs directly when available

### Weaknesses

1. **Vendor lock-in** — depends on `server.smithery.ai` being up
2. **AGPL-3.0 license** — blocks commercial adoption
3. **290 open issues** — centralized proxy = every server bug becomes Smithery's bug
4. **Auth required** — OAuth for most operations adds friction
5. **No offline capability** — registry is API-only
6. **Complexity creep** — 25+ deps, Miniflare, ngrok, keychain, server hosting, skills
7. **Single-client install** — one app at a time (no multi-app selection)
8. **No lock file** — no centralized local tracking
9. **No TOML support**
10. **Inconsistent config format handling** — field mappings in config objects, not structured generators

### Strategic Positioning vs Smithery

> "Your MCP traffic shouldn't flow through someone else's cloud. getmcp generates native configs locally. MIT licensed, no auth required, works offline."

---

## 4. mcpm.sh / MCPM (MAIN OSS COMPETITOR)

**Repo**: https://github.com/pathintegral-institute/mcpm.sh
**Website**: https://mcpm.sh
**PyPI**: `mcpm`
**Created**: March 21, 2025 | **Latest release**: v2.13.0 (Jan 15, 2026) | **Stars**: 892

### What It Does

CLI-based MCP package manager that manages servers **globally**. Installs to `~/.config/mcpm/servers.json`, then pushes/syncs to individual clients. **Critical difference**: MCPM inserts `mcpm run <server>` into client configs — it stays in the execution path as a runtime dependency.

### CLI Commands (~24)

| Command                                             | Description                     |
| --------------------------------------------------- | ------------------------------- |
| `search [query]`                                    | Search registry                 |
| `info <server>`                                     | Server metadata                 |
| `install <server>`                                  | Install to global config        |
| `uninstall <server>`                                | Remove installed server         |
| `ls` / `list`                                       | List installed servers          |
| `edit <server>`                                     | Edit server config              |
| `new`                                               | Create new server entry         |
| `run <server>`                                      | Execute server (stdio/HTTP/SSE) |
| `inspect <server>`                                  | Debug/inspect running server    |
| `share <server>`                                    | Share via secure tunnel (frp)   |
| `usage`                                             | View analytics/stats            |
| `profile create/remove/edit/run/share/inspect/list` | Virtual profile management      |
| `client ls/edit/import`                             | Client management               |
| `config`                                            | Global settings                 |
| `doctor`                                            | Health diagnostics              |
| `migrate`                                           | v1 to v2 migration              |

### Supported Apps (14)

Claude Desktop, Claude Code, Cursor, Windsurf, VS Code, Cline, Continue, Goose CLI, 5ire, Roo Code, Trae, Gemini CLI, Codex CLI, Qwen CLI

**Clients mcpm.sh has that getmcp doesn't**: Continue, 5ire, Trae, Gemini CLI, Codex CLI, Qwen CLI

**Clients getmcp has that mcpm.sh doesn't**: OpenCode, Zed, PyCharm

### Registry

- **379 server manifests** as JSON files in `mcp-registry/servers/`
- Rich JSON Schema (Draft 2020-12): name, display_name, description, repository, license, author, homepage, categories, tags, is_official, is_archived, installations (multiple methods), arguments, tools (with input schemas), resources, prompts, examples
- Hosted at `https://mcpm.sh/api/servers.json`, cached locally for 1 hour
- **Automated submission bot** (`mcpm-registry-bot`) generates manifests from documentation URLs
- Web UI: Jekyll static site at `mcpm.sh/registry/` with search, tag filtering, sorting

### Tech Stack

Python >= 3.11, Click + Rich, Pydantic + JSON Schema, DuckDB + SQLite (analytics), fastmcp 2.13.0, ruamel-yaml, Hatchling, Ruff, pytest, Jekyll (web), semantic-release

### Strengths

1. **Largest OSS registry** — 379 servers with automated submission bot
2. **Profile system** — tag-based grouping, many-to-many servers/profiles
3. **Server execution** — `mcpm run` directly runs servers
4. **Server sharing** — frp-based secure tunneling
5. **Usage analytics** — SQLite-backed monitoring
6. **Client import** — detect existing non-MCPM servers and adopt them
7. **Health diagnostics** — `mcpm doctor` checks Python, Node, clients, config
8. **Non-interactive mode** — env vars for scripting + agent docs (llm.txt, CLAUDE.md, GEMINI.md, QWEN.md)
9. **Community traction** — 892 stars, 94 forks, 27 contributors
10. **Rich server manifests** — multi-method installations, tool definitions, resources
11. **Multi-method installations** — npm, python, docker, uvx, http, custom per server

### Weaknesses

1. **Runtime dependency** — `mcpm run <server>` in client configs means if mcpm breaks, ALL servers across ALL apps break
2. **Python ecosystem friction** — requires Python >= 3.11, pip/pipx/uv installation
3. **Two-step workflow** — `install` then `client edit` are separate operations
4. **No TOML support**
5. **Slowing development** — last feature release Jan 15, 2026
6. **Registry quality concerns** — `.failed_installations.json` hints at validation issues, bug #270 shows incorrect manifests
7. **No web framework** — Jekyll static site, no interactive config viewer
8. **Monolithic codebase** — can't use components as libraries
9. **Core UX bugs** — UVX compatibility (#249), CLI help rendering (#259)
10. **No library/programmatic API** — CLI-only

### Strategic Positioning vs mcpm.sh

> "getmcp writes configs and gets out of the way. mcpm.sh inserts itself as a runtime proxy — if it breaks, every server across every app breaks. getmcp generates self-contained, independent configs."

---

## getmcp's Key Differentiators

### 1. "Write and Get Out of the Way" Architecture

Generates **native config entries** and exits. No runtime dependency. mcpm.sh inserts `mcpm run`, Smithery routes through `server.smithery.ai`. getmcp configs are self-contained.

### 2. Library-First Modular Design

`@getmcp/core`, `@getmcp/generators`, `@getmcp/registry` usable as npm libraries. **No competitor offers this.** Other tools can build on top of getmcp.

### 3. No Vendor Lock-in, No Auth, Fully Offline

Smithery requires OAuth. MCPHub requires cloud. getmcp: zero accounts, works offline.

### 4. MIT License (vs Smithery's AGPL)

Companies can freely integrate getmcp. AGPL is a hard blocker for many.

### 5. Multi-App Installation in One Command

`getmcp add github` detects all installed apps, installs to all at once. Smithery and mcpm.sh force one-at-a-time.

### 6. Config Format Breadth

JSON, JSONC, YAML, **and TOML** — no competitor handles all four.

### 7. Strongest Test Suite

335 tests across 12 files. Zod validation throughout. mcpm.sh uses pytest but has known core bugs. mcp-get/MCPHub have minimal/zero tests.

---

## Strategic Plan to Win

### Phase 1: Close Critical Gaps (Weeks 1-2)

| Action                                                                                                        | Why                                                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Scale registry to 100+ servers**                                                                            | 35 vs 379 is the most visible weakness. Prioritize popular servers from mcpm.sh's registry.            |
| **Add missing clients**: Amazon Q, Gemini CLI, Codex CLI, Trae, Continue, BoltAI, LibreChat, VS Code Insiders | Match mcpm.sh's 14, close gap with Smithery's 19.                                                      |
| **Fix known bugs**                                                                                            | Goose headers, Context7 runtime, filesystem placeholder, timeout forwarding, description preservation. |
| **Add CLI command tests**                                                                                     | Protect the quality story.                                                                             |
| **Set GitHub repo description & topics**                                                                      | Basic discoverability.                                                                                 |

### Phase 2: Unique Features (Weeks 3-5)

| Feature                             | Why It Wins                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **`getmcp doctor`**                 | Check all apps' configs, validate schemas, detect stale servers, verify env vars. Better than mcpm.sh's version.       |
| **Remote registry sources**         | `getmcp add --from https://...` — install from any URL. Bridges registry gap without needing a cloud.                  |
| **`getmcp import`**                 | Detect existing MCP servers in app configs, adopt into getmcp management. mcpm.sh has this — powerful onboarding hook. |
| **`--json` / `--quiet` output**     | Machine-readable for CI/CD and AI agents.                                                                              |
| **Unverified package escape hatch** | Install any npm/pip package not in registry by providing runtime type. Removes registry bottleneck.                    |
| **App restart integration**         | Detect running Claude Desktop/Cursor, offer restart after config changes.                                              |

### Phase 3: Distribution & Growth (Weeks 4-8)

| Action                                                | Why                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Submit to `awesome-mcp-servers`** and similar lists | mcp-get and mcpm.sh got early stars from awesome lists.                                  |
| **Comparison blog post**                              | "getmcp vs Smithery vs mcpm.sh" — position as open, local-first, no-lock-in alternative. |
| **Create `llm.txt` / agent docs**                     | mcpm.sh ships CLAUDE.md/GEMINI.md for AI agents. Make agents recommend getmcp.           |
| **Homebrew formula**                                  | `brew install getmcp` removes npx friction.                                              |
| **Promote getmcp.es**                                 | Per-app config viewer is a standalone resource even without CLI.                         |
| **Target mcp-get's orphaned users**                   | 506 stars of users told "go use Smithery." Offer the open-source alternative.            |
| **Community (GitHub Discussions / Discord)**          | mcpm.sh has WeChat (Chinese market). Target English-speaking/global devs.                |

### Phase 4: Moat Features (Weeks 6-12)

| Feature                                        | Edge                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| **Profile/workspace support**                  | Group servers by project via `getmcp.json` per-project manifests.               |
| **`getmcp run`** (optional, not a runtime dep) | Test servers locally before installing. Unlike mcpm.sh, never make it required. |
| **Config diff/audit**                          | Show what changed between versions. No competitor has this.                     |
| **Community registry (web submissions)**       | Submit servers via getmcp.es without GitHub. Lower barrier than PRs.            |
| **Plugin system for custom registries**        | `getmcp add --registry=https://internal.company.com` for organizations.         |
| **Automated manifest generation bot**          | Like mcpm.sh's bot — auto-generate entries from server docs/URLs.               |

---

## Positioning One-Liners

| vs           | Message                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Smithery** | "Your MCP traffic shouldn't flow through someone else's cloud. getmcp generates native configs locally. MIT licensed, no auth, works offline." |
| **mcpm.sh**  | "getmcp writes configs and gets out of the way. mcpm.sh makes itself a runtime proxy — if it breaks, every server across every app breaks."    |
| **mcp-get**  | "mcp-get is deprecated and only supported Claude Desktop. getmcp supports 12+ apps with native format generation."                             |
| **General**  | "The npm of MCP servers — install once, configure everywhere, with zero lock-in."                                                              |
