# agent.md — getmcp Codebase Guide

> For the complete specification (schemas, transformation rules, config formats, research appendix), see [`SPECIFICATION.md`](./.agents/docs/SPECIFICATION.md).

---

## Project Summary

**getmcp** is a universal installer and configuration tool for MCP (Model Context Protocol) servers across all AI applications. Every AI app (Claude Desktop, VS Code, Cursor, Goose, Windsurf, Zed, etc.) uses a different config format for MCP servers — different root keys, field names, file formats, and conventions. getmcp solves this by defining a single canonical format (aligned with the [official MCP registry schema](https://registry.modelcontextprotocol.io/)), then using generators to transform it into each app's native format. A registry of popular servers, a CLI for automated installation, and a web directory complete the toolchain.

---

## Architecture Overview

This is a **TypeScript monorepo** (npm workspaces, ESM-only, Node >= 22.17) with 5 packages:

```
@getmcp/cli -----> @getmcp/generators -----> @getmcp/core
            \----> @getmcp/registry   -----> @getmcp/core
@getmcp/web -----> @getmcp/core + @getmcp/generators + @getmcp/registry
```

| Package               | npm Name             | Purpose                                                                                                                                                                                                                         |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core`       | `@getmcp/core`       | Zod schemas, TypeScript types, utility functions (type guards, transport inference)                                                                                                                                             |
| `packages/generators` | `@getmcp/generators` | 19 config generators (one per AI app), each transforms canonical format to app-native format                                                                                                                                    |
| `packages/registry`   | `@getmcp/registry`   | Catalog of MCP server definitions with search/filter API                                                                                                                                                                        |
| `packages/cli`        | `@getmcp/cli`        | CLI tool: `add`, `remove`, `list`, `find`, `check`, `update`, `doctor`, `import`, `sync`, `registry` commands with app auto-detection, config merging, multi-registry support, and installation tracking via `getmcp-lock.json` |
| `packages/web`        | `@getmcp/web`        | Astro static web directory for browsing servers and generating config snippets (static `.astro` components with small scripts; React only for the `/servers` search island), with Cloudflare Web Analytics                      |

**Tech stack**: TypeScript 5.7+, Zod 4.0+, Vitest 3.0+, Astro 7.3+ (web, static output), React 19 (web `/servers` search island), Tailwind CSS 4.3+ (web), `@clack/prompts` (CLI). **Linting/Formatting**: oxlint + oxfmt, enforced via lefthook pre-commit hook.

> See `.agents/docs/SPECIFICATION.md` Section 3 for the full architecture breakdown.

---

## Key Concepts

- **Canonical Format**: Single format aligned with the [official MCP registry schema](https://registry.modelcontextprotocol.io/) (root key `mcpServers`). Stdio: `command`, `args`, `env`, `cwd`, `timeout`, `description`. Remote: `url`, `transport`, `headers`, `timeout`, `description`. Transport auto-inferred from URL.
- **Generators**: Extend `BaseGenerator` (`packages/generators/src/base.ts`), implement `generate()` to transform canonical → app-native format. Each implements `detectInstalled()` for platform-specific app detection.
- **Registry**: `Map<string, InternalRegistryEntry>` keyed by official reverse-DNS name (e.g. `io.github.github/github-mcp-server`), with search and filtering functions. `getServer()` is ID-only; use `getServerBySlug()` for slug lookups (web URLs).
- **CLI**: Auto-detects installed apps, prompts for env vars, generates app-specific configs, and **merges** into existing files (never overwrites). Tracks installations in `getmcp-lock.json`.
- **Design Principles**: (1) Never overwrite (2) Canonical format as single source of truth (3) Auto-detect apps (4) Platform-aware path resolution (5) Schema-validated via Zod

> See [file-map.md](./.agents/docs/file-map.md) for the complete file-by-file reference.

---

## Common Tasks

### MCP server registry

Server data is synced from the [official MCP registry](https://registry.modelcontextprotocol.io) via `packages/registry/scripts/sync.ts`. To add a new server, submit it to the official registry — getmcp syncs automatically via the daily GitHub Actions workflow.

### Adding a new generator (supporting a new AI app)

1. Add the new app ID to the `AppId` enum in `packages/core/src/schemas.ts`
2. Create `packages/generators/src/<app-name>.ts` extending `BaseGenerator`
3. Implement `generate()` with the app's field mappings; override `serialize()` if non-JSON
4. Set the `app` property with `AppMetadata` (id, name, configFileName, configPaths per platform, docsUrl)
5. Register the generator in `packages/generators/src/index.ts`
6. Add stdio + remote tests in `packages/generators/tests/generators.test.ts`
7. Add detection paths in `packages/cli/src/detect.ts` if the app has a known config file location
8. Add a guide entry in `packages/web/src/lib/guide-data.ts` (its name is the app label); `ConfigViewer.astro` lists every generator automatically

### Modifying an existing generator's transformation rules

1. Locate the generator file: `packages/generators/src/<app-name>.ts`
2. Review its `generate()` method to understand current field mappings
3. Make changes and run `npx vitest packages/generators` to validate
4. Cross-reference with `.agents/docs/SPECIFICATION.md` Section 5 and Section 10 for the app's official format

### Adding a CLI command

1. Create `packages/cli/src/commands/<command>.ts`
2. Wire it into `packages/cli/src/bin.ts` argument dispatch using dynamic `import()`
3. Add command aliases in `packages/cli/src/utils.ts` (`COMMAND_ALIASES` map) if the command should have shorthand names
4. Handle prompt cancellation using the `exitIfCancelled()` helper from `packages/cli/src/utils.ts`
5. Add tests in `packages/cli/tests/`

### Post-Implementation Documentation Check

After every code implementation (new feature, new command, new file, bug fix, refactor, etc.), review the following documentation files and update any that are affected:

| File                            | What to check                                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                     | File map matches actual source files; test counts are accurate; common tasks sections reflect current workflow                                                                         |
| `.agents/docs/SPECIFICATION.md` | Schemas, command docs, transformation rules, test counts, and monorepo tree match the implementation. **Do not add future plans here** — all roadmap items belong in `ROADMAP.md` only |
| `.agents/docs/ROADMAP.md`       | Newly implemented items are marked `[x]` with a note about the implementing file. This is the **single source of truth** for all planned/future work                                   |
| `packages/cli/README.md`        | New commands, flags, supported apps, and API exports are documented                                                                                                                    |

This is not optional — documentation drift causes confusion and wastes time. Treat it as part of completing the implementation.

---

## Testing

- **798 tests** across 37 test files
- Run all tests: `npx vitest` (from repo root)
- Run per-package: `npx vitest packages/core`, `npx vitest packages/generators`, etc. (`npx vitest --project web` for the web package)
- Test locations:
  - `packages/core/tests/` — schema validation (including RegistrySource, RegistryCredential, RegistryAuthMethod), type guards, transport inference, ProjectManifest
  - `packages/generators/tests/` — all 19 generators (stdio + remote + multi-server + serialization + detectInstalled)
  - `packages/registry/tests/` — entry validation, lookup, search, categories, content integrity, fetch-metrics
  - `packages/cli/tests/` — app-selection, bin flags, config-file I/O, credentials, detect, errors, format, lock file, preferences, registry-cache, registry-config, utils
  - `packages/cli/tests/commands/` — add, check, doctor, find, import, list, registry, remove, sync, update command tests
  - `packages/web/tests/` — metadata resolution, sitemap, server detail helpers, OG image rendering, text formatting (`toSentence`), JSON-LD escaping, server sorting and default search state
- Quick local web build (never run a full build locally: ~32 min, ~79,500 files): from `packages/web` run `WEB_MAX_SERVER_PAGES=200 npx astro build --outDir node_modules/.partial-dist`, then delete that folder. `WEB_MAX_SERVER_PAGES` caps the `/servers/[id]` pages and OG images (`src/lib/server-paths.ts`) and always keeps a fixed set of representative slugs (e.g. `github-github`). The `outDir` must be on the same drive as the repo (Astro moves assets with `fs.rename`, which fails with `EXDEV` across drives); `node_modules` is git-ignored.

---

## Publishing

Auto-release via conventional commits (`.github/workflows/publish.yml`). Uses OIDC trusted publishing — no tokens.

- **NEVER** add `NODE_AUTH_TOKEN` or `NPM_TOKEN` environment variables to the publish workflow
- **NEVER** create or store npm access tokens in repository secrets for publishing

> See [publishing.md](./.agents/docs/publishing.md) for trigger paths, workflow steps, OIDC rules, and edge cases.

---

## Commit Convention

Follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Scopes: `core`, `generators`, `registry`, `cli`, `web`. Breaking changes use `!` or `BREAKING CHANGE:` footer.

> See [commit-convention.md](./.agents/docs/commit-convention.md) for full types table and examples.

---

## Browser Support (web)

Progressive enhancement: features that are not Baseline widely available may be used only when the site still works without them (e.g. cross-document view transitions, speculation rules, `<dialog closedby>` with its small fallback). No polyfills. See the `modern-web-guidance` skill for per-feature fallbacks.

---

## Installed Skills

Skills are installed under `.agents/skills/`. See the skill files for triggers and descriptions.

---

## References

- **[`SPECIFICATION.md`](./.agents/docs/SPECIFICATION.md)** — Complete project specification: schemas, transformation rules per app, registry format, CLI behavior, research appendix
- **[`ROADMAP.md`](./.agents/docs/ROADMAP.md)** — Planned improvements and open tasks
- **[`design-system.md`](./.agents/docs/design-system.md)** — Web package design system: colors, fonts, typography, components, layout patterns, and OG image specs
- **[`competence.md`](./.agents/docs/competence.md)** — Competence analysis
- **[`css-scroll-spy.md`](./.agents/docs/css-scroll-spy.md)** — CSS scroll spy pattern: rules in a `public/` stylesheet (kept out of the CSS pipeline)
- **[`file-map.md`](./.agents/docs/file-map.md)** — Complete file-by-file reference for all 5 packages
- **[`publishing.md`](./.agents/docs/publishing.md)** — Auto-release workflow, OIDC trusted publishing, trigger paths, edge cases
- **[`commit-convention.md`](./.agents/docs/commit-convention.md)** — Conventional Commits types, scopes, and examples
- **[`external-apis.md`](./.agents/docs/external-apis.md)** — External API endpoints, data fetched, error handling, and official docs links
- **Repository**: `https://github.com/RodrigoTomeES/getmcp`
