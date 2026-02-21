# agent.md — getmcp Codebase Guide

> For the complete specification (schemas, transformation rules, config formats, research appendix), see [`SPECIFICATION.md`](./SPECIFICATION.md).

---

## Project Summary

**getmcp** is a universal installer and configuration tool for MCP (Model Context Protocol) servers across all AI applications. Every AI app (Claude Desktop, VS Code, Cursor, Goose, Windsurf, Zed, etc.) uses a different config format for MCP servers — different root keys, field names, file formats, and conventions. getmcp solves this by defining a single canonical format (aligned with FastMCP), then using generators to transform it into each app's native format. A registry of popular servers, a CLI for automated installation, and a web directory complete the toolchain.

---

## Architecture Overview

This is a **TypeScript monorepo** (npm workspaces, ESM-only, Node >= 22) with 5 packages:

```
@getmcp/cli -----> @getmcp/generators -----> @getmcp/core
            \----> @getmcp/registry   -----> @getmcp/core
@getmcp/web -----> @getmcp/core + @getmcp/generators + @getmcp/registry
```

| Package | npm Name | Purpose |
|---------|----------|---------|
| `packages/core` | `@getmcp/core` | Zod schemas, TypeScript types, utility functions (type guards, transport inference) |
| `packages/generators` | `@getmcp/generators` | 11 config generators (one per AI app), each transforms canonical format to app-native format |
| `packages/registry` | `@getmcp/registry` | Catalog of MCP server definitions with search/filter API |
| `packages/cli` | `@getmcp/cli` | CLI tool: `add`, `remove`, `list`, `find`, `check`, `update`, `init` commands with app auto-detection, config merging, and installation tracking via `getmcp-lock.json` |
| `packages/web` | `@getmcp/web` | Next.js (App Router) web directory for browsing servers and generating config snippets |

**Tech stack**: TypeScript 5.7+, Zod 3.24+, Vitest 3.0+, Next.js 15.3+ (web), Tailwind CSS 4.0+ (web), `@inquirer/prompts` (CLI).

> See `SPECIFICATION.md` Section 3 for the full architecture breakdown.

---

## Key Concepts

### Canonical Format

All server configs are defined in a single FastMCP-aligned format. Root key: `mcpServers`.

- **Stdio servers**: `command`, `args`, `env`, `cwd`, `timeout`, `description`
- **Remote servers**: `url`, `transport` (`http` | `streamable-http` | `sse`), `headers`, `timeout`, `description`

Transport is auto-inferred: URLs with `/sse` default to SSE, others to HTTP.

> See `SPECIFICATION.md` Section 4 for full schema definitions.

### Generators

Each generator implements the `ConfigGenerator` interface (defined in `packages/core/src/types.ts`) and extends `BaseGenerator` (in `packages/generators/src/base.ts`). A generator transforms the canonical format into one app's native format — renaming fields, changing root keys, adding app-specific fields, or switching file formats (e.g., YAML for Goose).

> See `SPECIFICATION.md` Section 5 for all transformation rules per app.

### Registry

A `Map<string, RegistryEntry>` of server definitions. Each entry contains metadata (id, name, description, categories, author, runtime) plus the canonical `ServerConfig`. The registry exposes lookup, search, and filtering functions.

### CLI

The CLI auto-detects installed AI apps by checking platform-specific config paths, prompts for required environment variables, generates app-specific configs, and **merges** them into existing config files (never overwrites). It handles JSON, JSONC, YAML, and TOML formats. Installations are tracked in a project-level `getmcp-lock.json` file, enabling `check` and `update` workflows.

### Design Principles

1. **Never overwrite** — always merge into existing config files
2. **Canonical format** — one source of truth, generators handle transformations
3. **Auto-detect** — find installed apps by checking known config paths per OS
4. **Platform-aware** — resolves `~`, `%AppData%`, `%UserProfile%`, `%LocalAppData%`
5. **Schema-validated** — all data flows through Zod schemas at runtime

---

## Package Map — Key Files

### `@getmcp/core` (`packages/core/src/`)

| File | Purpose |
|------|---------|
| `schemas.ts` | All Zod schemas: `StdioServerConfig`, `RemoteServerConfig`, `ServerConfig`, `CanonicalMCPConfig`, `RegistryEntry`, `AppId` |
| `types.ts` | TypeScript types inferred from Zod; `ConfigGenerator` and `AppMetadata` interfaces |
| `utils.ts` | Type guards (`isStdioConfig`, `isRemoteConfig`) and `inferTransport()` |

### `@getmcp/generators` (`packages/generators/src/`)

| File | Purpose |
|------|---------|
| `base.ts` | `BaseGenerator` abstract class with `generate()`, `generateAll()`, `serialize()`, `deepMerge()`, field extraction helpers |
| `claude-desktop.ts` | Passthrough — canonical IS the native format |
| `claude-code.ts` | Near-passthrough; renames `transport` to `type` for remote |
| `vscode.ts` | Root key `servers`; adds `type` field on every server; maps `streamable-http` to `http` |
| `cursor.ts` | Passthrough (same as Claude Desktop) |
| `cline.ts` | Adds `alwaysAllow: []` and `disabled: false` |
| `roo-code.ts` | Adds `alwaysAllow: []`, `disabled: false`; maps `http` to `streamable-http` |
| `goose.ts` | YAML output; root key `extensions`; renames `command` to `cmd`, `env` to `envs`; timeout ms to seconds |
| `windsurf.ts` | Remote uses `serverUrl` instead of `url` |
| `opencode.ts` | Root key `mcp`; merges `command`+`args` into array; renames `env` to `environment` |
| `zed.ts` | Root key `context_servers` |
| `pycharm.ts` | Passthrough; project-level config at `.ai/mcp/mcp.json` (requires JetBrains AI Assistant plugin) |
| `index.ts` | Generator registry: maps `AppId` to generator instances; exports `generateConfig()`, `getGenerator()`, `getAppIds()` |

### `@getmcp/registry` (`packages/registry/src/`)

| File | Purpose |
|------|---------|
| `index.ts` | Registry engine: `getServer()`, `getAllServers()`, `searchServers()`, `getServersByCategory()`, `getCategories()` |
| `servers/*.ts` | Individual server definitions (one file per server), each exports a `RegistryEntryType` |

### `@getmcp/cli` (`packages/cli/src/`)

| File | Purpose |
|------|---------|
| `bin.ts` | Entry point; parses argv, dispatches to commands via `resolveAlias()` |
| `detect.ts` | `resolvePath()`, `getConfigPath()`, `detectApps()`, `detectInstalledApps()` |
| `format.ts` | `detectConfigFormat()` — infers config file format (json/jsonc/yaml/toml) from file extension |
| `config-file.ts` | Multi-format config file I/O: `readConfigFile()`, `writeConfigFile()`, `mergeServerIntoConfig()`, `removeServerFromConfig()`, `listServersInConfig()`, `stripJsoncComments()`. Auto-detects format (JSON, JSONC, YAML, TOML) from file extension. |
| `lock.ts` | Installation tracking via `./getmcp-lock.json`: `readLockFile()`, `writeLockFile()`, `trackInstallation()`, `trackRemoval()`, `getTrackedServers()` |
| `errors.ts` | Error types (`CliError`, `ConfigParseError`, `AppNotDetectedError`, `InvalidAppError`, `ServerNotFoundError`, `NonInteractiveError`) and `formatError()` utility |
| `utils.ts` | `parseFlags()` for CLI flag parsing, `resolveAlias()` for command alias resolution, `shortenPath()` for display |
| `preferences.ts` | Global user preferences at `~/.config/getmcp/preferences.json` (remembers selected apps across invocations) |
| `commands/add.ts` | Interactive add workflow: pick server, prompt env vars, detect apps, generate + merge configs |
| `commands/remove.ts` | Interactive remove workflow with `--dry-run` and `--yes` support |
| `commands/list.ts` | List/search/filter servers |
| `commands/find.ts` | Interactive fuzzy server search with inline add flow (aliases: `search`, `s`, `f`) |
| `commands/check.ts` | Validate tracked installations against registry and app configs |
| `commands/update.ts` | Re-generate and merge configs for all tracked installations |
| `commands/init.ts` | Interactive wizard to scaffold a new server registry entry |

### `@getmcp/web` (`packages/web/src/`)

| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage with hero section and search |
| `app/servers/[id]/page.tsx` | Dynamic server detail page (statically generated from registry) |
| `components/ConfigViewer.tsx` | Client component: tab selector for all 11 apps, shows generated config snippet with copy button |
| `components/SearchBar.tsx` | Search and filter component |
| `components/ServerCard.tsx` | Server listing card |

---

## Common Tasks

### Adding a new MCP server to the registry

1. Create `packages/registry/src/servers/<id>.ts` exporting a `RegistryEntryType` object
2. Import and register it in `packages/registry/src/index.ts` (add to the `Map`)
3. Add a validation test in `packages/registry/tests/registry.test.ts`
4. The server will automatically appear in CLI search, web directory, and all generators

> See `SPECIFICATION.md` Section 6 for the `RegistryEntry` schema and an example.

### Adding a new generator (supporting a new AI app)

1. Add the new app ID to the `AppId` enum in `packages/core/src/schemas.ts`
2. Create `packages/generators/src/<app-name>.ts` extending `BaseGenerator`
3. Implement `generate()` with the app's field mappings; override `serialize()` if non-JSON
4. Set the `app` property with `AppMetadata` (id, name, configFileName, configPaths per platform, docsUrl)
5. Register the generator in `packages/generators/src/index.ts`
6. Add stdio + remote tests in `packages/generators/tests/generators.test.ts`
7. Add detection paths in `packages/cli/src/detect.ts` if the app has a known config file location
8. Update `packages/web/src/components/ConfigViewer.tsx` to include the new app tab

### Modifying an existing generator's transformation rules

1. Locate the generator file: `packages/generators/src/<app-name>.ts`
2. Review its `generate()` method to understand current field mappings
3. Make changes and run `npx vitest packages/generators` to validate
4. Cross-reference with `SPECIFICATION.md` Section 5 and Section 10 for the app's official format

### Adding a CLI command

1. Create `packages/cli/src/commands/<command>.ts`
2. Wire it into `packages/cli/src/bin.ts` argument dispatch
3. Add command aliases in `packages/cli/src/utils.ts` (`COMMAND_ALIASES` map) if the command should have shorthand names
4. Add tests in `packages/cli/tests/`

### Post-Implementation Documentation Check

After every code implementation (new feature, new command, new file, bug fix, refactor, etc.), review the following documentation files and update any that are affected:

| File | What to check |
|------|---------------|
| `CLAUDE.md` | File map matches actual source files; test counts are accurate; common tasks sections reflect current workflow |
| `SPECIFICATION.md` | Schemas, command docs, transformation rules, test counts, and monorepo tree match the implementation |
| `ROADMAP.md` | Newly implemented items are marked `[x]` with a note about the implementing file |
| `packages/cli/README.md` | New commands, flags, supported apps, and API exports are documented |

This is not optional — documentation drift causes confusion and wastes time. Treat it as part of completing the implementation.

---

## Testing

- **331 tests** across 11 test files
- Run all tests: `npx vitest` (from repo root)
- Run per-package: `npx vitest packages/core`, `npx vitest packages/generators`, etc.
- Test locations:
  - `packages/core/tests/` — schema validation, type guards, transport inference
  - `packages/generators/tests/` — all 12 generators (stdio + remote + multi-server + serialization)
  - `packages/registry/tests/` — entry validation, lookup, search, categories, content integrity
  - `packages/cli/tests/` — path resolution, app detection, config read/write/merge/remove, lock file, errors, preferences, utils

---

## Publishing

This project uses [npm trusted publishing with OIDC](https://docs.npmjs.com/trusted-publishers) for authentication when publishing to npm. This is a tokenless flow — **never** add `NODE_AUTH_TOKEN`, `NPM_TOKEN`, or any npm access token secret to the publish workflow.

### How it works

1. The publish workflow (`.github/workflows/publish.yml`) declares `permissions: id-token: write`
2. When `npm publish` runs, the npm CLI automatically detects the GitHub Actions OIDC environment
3. npm exchanges the short-lived OIDC token for a temporary npm publish credential
4. The package is published without any long-lived secrets

### Rules

- **NEVER** add `NODE_AUTH_TOKEN` or `NPM_TOKEN` environment variables to the publish workflow
- **NEVER** create or store npm access tokens in repository secrets for publishing
- **DO** keep `permissions: id-token: write` in the publish workflow — this is what enables OIDC
- **DO** keep `registry-url: https://registry.npmjs.org` in the `actions/setup-node` step — this is required for the npm CLI to detect the OIDC environment
- Provenance attestations are generated automatically when publishing via trusted publishing

### References

- [npm trusted publishing docs](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OIDC documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm trusted publishing announcement](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)

---

## Commit Convention

This project follows the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification. All commit messages must be structured as:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Purpose |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation-only changes |
| `style` | Code style changes (formatting, whitespace, etc.) |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Changes to the build system or dependencies |
| `ci` | Changes to CI configuration |
| `chore` | Other changes that don't modify src or test files |

### Scopes

Use the package name as scope when the change is specific to one package:

- `core`, `generators`, `registry`, `cli`, `web`

### Examples

```
feat(generators): add support for new AI app
fix(cli): handle missing config file gracefully
docs: update CLAUDE.md with commit convention
test(registry): add search edge case tests
refactor(core): simplify transport inference logic
chore: update dependencies
feat(web)!: redesign server detail page layout
```

Breaking changes must include `!` after the type/scope or a `BREAKING CHANGE:` footer.

---

## Installed Skills

Skills are installed under `.agents/skills/` and provide specialized capabilities:

| Skill | Description | Trigger |
|-------|-------------|---------|
| `agent-browser` | Browser automation CLI (navigate, snapshot, interact, screenshot, scrape) | User needs to interact with websites, fill forms, take screenshots, test web apps |
| `vercel-composition-patterns` | React composition patterns (compound components, context providers, state management) | Refactoring components with boolean props, building component libraries, designing reusable APIs |
| `frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality | Building web components, pages, dashboards, or styling/beautifying any web UI |
| `web-design-guidelines` | Review UI code for Web Interface Guidelines compliance | "Review my UI", "check accessibility", "audit design", "review UX" |
| `vercel-react-best-practices` | React/Next.js performance optimization (57 rules across 8 categories) | Writing, reviewing, or refactoring React/Next.js code for performance |
| `find-skills` | Discover and install agent skills from the ecosystem | "How do I do X", "find a skill for X", extending agent capabilities |

---

## References

- **[`SPECIFICATION.md`](./SPECIFICATION.md)** — Complete project specification: schemas, transformation rules per app, registry format, CLI behavior, research appendix with every app's config format documented
- **Repository**: `https://github.com/RodrigoTomeES/getmcp`
