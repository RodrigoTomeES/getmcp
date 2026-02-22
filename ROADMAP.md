# getmcp Roadmap

> Last updated: 2026-02-22

This document tracks all planned improvements, bug fixes, and feature work for the getmcp project. Items are organized by priority and category, with checkboxes to track completion.

---

## Legend

- **Priority**: Critical > High > Medium > Low
- **Status**: Unchecked = planned, Checked = completed

---

## 1. Critical — Security

These issues should be addressed immediately.

- [x] **Revoke committed secret** — Verified as a false positive: `.env` does not exist on disk and was never committed to git history. `.gitignore` already excludes `.env`, `.env.*`, and `.env.local`.

- [x] **Add `publishConfig` for public access** — Added `"publishConfig": { "access": "public" }` to all 4 package.json files (`core`, `generators`, `registry`, `cli`) so scoped `@getmcp/*` packages publish as public.
  - **Note:** This project uses [npm trusted publishing with OIDC](https://docs.npmjs.com/trusted-publishers) for authentication. `NODE_AUTH_TOKEN` must **never** be added to the workflow — the `permissions: id-token: write` in `publish.yml` handles authentication via short-lived OIDC tokens. See the Publishing section in `CLAUDE.md` for details.

- [x] **Mask sensitive env var prompts** — The CLI now uses `password()` from `@inquirer/prompts` for env vars whose names match common secret patterns (`TOKEN`, `KEY`, `SECRET`, `PASSWORD`, `CREDENTIAL`, `AUTH`, `PAT`, `PRIVATE`). Non-sensitive vars (e.g., `GITHUB_OWNER`) still use cleartext `input()`.
  - File: `packages/cli/src/commands/add.ts`

---

## 2. High — Code Correctness

Bugs and incorrect behavior that affect users.

- [x] **Fix hardcoded CLI version** — Replaced the hardcoded `VERSION = "0.1.0"` with a dynamic read from `package.json` using `createRequire`. The version can never drift again.
  - File: `packages/cli/src/bin.ts`

- [x] **Fix AppId test coverage** — Updated test to cover all 19 app IDs including `pycharm`, `codex`, and 7 new generators.
  - File: `packages/core/tests/schemas.test.ts`

- [x] **Fix Goose remote headers mapping** — Changed `envs: config.headers` to `headers: config.headers` for remote configs.
  - File: `packages/generators/src/goose.ts`

- [x] **Fix Context7 runtime field** — Removed `runtime: "node"` from the remote server definition.
  - File: `packages/registry/src/servers/context7.ts`

- [ ] **Fix filesystem server placeholder arg** — The `args` array includes `/path/to/allowed/directory`, a placeholder the user must customize. There is no mechanism to prompt for this or indicate it needs customization. Consider adding it to `requiredEnvVars` or introducing a `requiredArgs` field.
  - File: `packages/registry/src/servers/filesystem.ts` (line 10)

- [x] **Add missing `timeout` forwarding in generators** — Added timeout forwarding to all affected generators.
  - Files: `packages/generators/src/cline.ts`, `roo-code.ts`, `windsurf.ts`, `zed.ts`

- [x] **Preserve `description` field in generator output** — Added `description` to `toStdioFields()` and `toRemoteFields()` in `BaseGenerator`, and in custom generators (goose, opencode, codex).
  - File: `packages/generators/src/base.ts`

---

## 3. High — Test Coverage

Critical gaps in test coverage.

- [x] **Add tests for CLI commands** — Added tests for `list.ts` (JSON/quiet output modes), `doctor.ts`, `import.ts`, and `sync.ts`. Interactive commands (`add.ts`, `remove.ts`) still need mock-based testing.
  - Files: `packages/cli/tests/commands/list.test.ts`, `doctor.test.ts`, `import.test.ts`, `sync.test.ts`

- [x] **Add tests for `bin.ts` argument parsing** — Added tests for `--json`, `--quiet`/`-q`, `--from-npm`, `--from-pypi`, `--from-url` flag parsing, and `doctor`/`dr` alias resolution.
  - File: `packages/cli/tests/bin.test.ts`

- [ ] **Add unit tests for `deepMerge`** — Used by `BaseGenerator.generateAll()` but has no standalone tests. Edge cases to cover: merging with `null`, arrays, nested objects of different shapes, empty objects.
  - File: `packages/generators/src/base.ts` (lines 41-62)

- [ ] **Add error path tests for `toStdioFields`/`toRemoteFields`** — These helper methods throw when passed the wrong config type, but those error paths have no test coverage.
  - File: `packages/generators/src/base.ts`

- [ ] **Add tests for web package** — The entire Next.js app has zero tests. Should add at minimum: component tests for `ConfigViewer`, `SearchBar`, `ServerCard`; integration tests for server detail pages; snapshot tests for key layouts.
  - Directory: `packages/web/`

---

## 4. Medium — CLI UX Improvements

Features that improve the developer experience.

- [x] **Add `--app` flag for non-interactive usage** — Allows targeting specific apps without interactive prompts (e.g., `getmcp add github --app=vscode`). Supports repeatable `--app` flags for multiple apps.
  - Files: `packages/cli/src/utils.ts` (flag parsing), `packages/cli/src/commands/add.ts`, `packages/cli/src/bin.ts`

- [x] **Add `--dry-run` option** — Previews what changes would be made to config files without actually writing them. Shows generated config per app.
  - Files: `packages/cli/src/commands/add.ts`, `packages/cli/src/commands/remove.ts`, `packages/cli/src/commands/update.ts`

- [x] **Add `--json` / `--quiet` output mode** — Added `--json` and `--quiet`/`-q` flags to `list`, `add`, and `check` commands. JSON outputs structured data, quiet outputs one ID per line.
  - Files: `packages/cli/src/commands/list.ts`, `add.ts`, `check.ts`, `packages/cli/src/utils.ts`

- [ ] **Add fuzzy matching to `remove` command** — Currently requires an exact server name. Should suggest similar names when no exact match is found (like `add` does with search).
  - File: `packages/cli/src/commands/remove.ts` (lines 19-24)

- [ ] **Handle empty registry gracefully** — If `getAllServers()` returns an empty array, `select()` from `@inquirer/prompts` receives empty `choices` and may crash. Add a guard with a clear error message.
  - File: `packages/cli/src/commands/add.ts` (lines 54-62)

- [ ] **Filter project-scoped apps by CWD context** — Project-scoped apps (VS Code, Cursor, Claude Code, OpenCode, PyCharm) always appear as options even when CWD is not a project directory. Should check for project indicators (e.g., `package.json`, `.git`, `pyproject.toml`) before offering project-scoped apps.
  - File: `packages/cli/src/commands/add.ts` (lines 85-87)

- [ ] **Add error recovery / rollback** — If writing to one app's config file succeeds but another fails, the user ends up in a partial state. Add rollback capability or at least warn the user which apps succeeded vs failed.
  - File: `packages/cli/src/commands/add.ts` (lines 127-139)

- [x] **Implement `getmcp update` command** — Re-generates and merges configs for all tracked installations using the current registry definitions. Supports `--yes`, `--app`, `--all-apps`, and `--dry-run` flags.
  - File: `packages/cli/src/commands/update.ts`

- [x] **Implement `getmcp sync` command** — Reads `getmcp.json` project manifest and installs all declared servers into detected apps. Supports env overrides and per-server app targeting. Interactive multiselect prompt (matching `add` command UX) shown when running without `--app`/`--all-apps`/`--yes` flags; includes saved preferences and non-detected project-scoped apps.
  - Files: `packages/cli/src/commands/sync.ts`, `packages/core/src/schemas.ts` (`ManifestServerEntry`, `ProjectManifest`)

- [x] **Implement `getmcp doctor` command** — Health diagnostics: installed apps, config parsing, registry status, orphaned servers, env vars, runtime dependencies (node, npx, uvx). Supports `--json` output.
  - File: `packages/cli/src/commands/doctor.ts`

- [x] **Implement `getmcp init` command** — Interactive wizard that scaffolds a new MCP server registry entry (TypeScript file) with all required metadata.
  - File: `packages/cli/src/commands/init.ts`

- [x] **Add `detectInstalled()` to generators** — Each generator now has a `detectInstalled()` method that checks if the app is installed using `existsSync()` on platform-specific directories. Replaces the old `detectApps()` logic that derived "installed" from config path parent directory existence. Shared path constants (`home`, `configHome`, `appData`, `claudeHome`, `codexHome`) in `base.ts` support env var overrides.
  - Files: `packages/core/src/types.ts`, `packages/generators/src/base.ts`, all 20 generator files, `packages/cli/src/detect.ts`

- [x] **Scope selection (global vs project)** — Added support for dual-scope MCP installations. Apps like Claude Code, Cursor, and Codex can install servers either globally or at the project level. Redesigned `AppMetadata` to use `configPaths: string | null` (project-scoped) + `globalConfigPaths: PlatformPaths | null` (global-scoped), replacing the old `scope` + platform-specific `configPaths` layout. Added `--global`/`-g` and `--project` CLI flags, interactive scope prompt for dual-scope apps, optional `scope` override in `ManifestServerEntry`, and **per-app** scope tracking in the lock file (`scopes` map instead of single `scope`). All commands (`add`, `sync`, `update`, `import`, `check`) wire scope through to `trackInstallation()`. The `check` command uses per-app scopes to resolve the correct config path (project vs global) for each app independently.
  - Files: `packages/core/src/types.ts`, `packages/core/src/schemas.ts`, `packages/generators/src/base.ts`, `packages/cli/src/commands/add.ts`, `packages/cli/src/commands/sync.ts`, `packages/cli/src/commands/update.ts`, `packages/cli/src/commands/import.ts`, `packages/cli/src/commands/check.ts`, `packages/cli/src/lock.ts`, `packages/cli/src/app-selection.ts`, `packages/cli/src/utils.ts`

---

## 5. Medium — CI / Build

Improvements to the continuous integration pipeline and build process.

- [x] **Add type checking step to CI** — Added `npm run lint` step to CI workflow.
  - File: `.github/workflows/ci.yml`

- [x] **Add linting and formatting** — Configured oxlint (linting) and oxfmt (formatting) with lefthook pre-commit hook. Replaces the originally planned ESLint + Prettier with faster Rust-based alternatives.
  - Files: `.oxlintrc.json`, `.oxfmtrc.json`, `lefthook.yml`

- [x] **Add Windows and macOS CI runners** — Added `matrix.os: [ubuntu-latest, windows-latest, macos-latest]` to CI workflow.
  - File: `.github/workflows/ci.yml`

- [x] **Add Dependabot configuration** — Created `.github/dependabot.yml` with npm and github-actions ecosystems, weekly schedule, grouped updates.
  - File: `.github/dependabot.yml`

- [x] **Publish packages to npm** — Auto-release workflow detects version bumps from conventional commits, bumps all workspace packages in sync, publishes to npm via OIDC trusted publishing, and creates a GitHub Release with changelog. Supports 3 trigger paths: push to main (auto-detect), tag push (legacy/fallback), and manual dispatch.
  - Files: `.github/workflows/publish.yml`, `.github/RELEASE_TEMPLATE.md`

> **Important — npm Publishing Authentication:**
> This project uses [npm trusted publishing with OIDC](https://docs.npmjs.com/trusted-publishers) instead of long-lived npm tokens. The `permissions: id-token: write` in `.github/workflows/publish.yml` enables this. **Never** add `NODE_AUTH_TOKEN`, `NPM_TOKEN`, or any npm access token secret to the publish workflow. The npm CLI automatically detects the OIDC environment and authenticates using short-lived, workflow-specific credentials. See the [npm trusted publishing docs](https://docs.npmjs.com/trusted-publishers) and the Publishing section in `CLAUDE.md` for details.

---

## 6. Medium — Web Improvements

Enhancements to the Next.js web directory.

- [x] **Replace `<a>` with Next.js `<Link>`** — Internal links now use `<Link>` for client-side navigation with prefetching. External links (GitHub, repository, homepage, docs) remain as `<a>` tags with `target="_blank"`.
  - Files: `packages/web/src/app/layout.tsx`, `packages/web/src/components/ServerCard.tsx`, `packages/web/src/app/servers/[id]/page.tsx`

- [x] **Replace `<img>` with Next.js `<Image>`** — The logo now uses `<Image>` from `next/image` for automatic image optimization.
  - File: `packages/web/src/app/layout.tsx`

- [x] **Add sitemap and robots.txt** — Created `sitemap.ts` (generates entries for homepage + all server detail pages) and `robots.ts` (allows all crawlers, references sitemap) using the Next.js Metadata API.
  - Files: `packages/web/src/app/sitemap.ts`, `packages/web/src/app/robots.ts`

- [x] **Add custom 404 page** — Created a styled `not-found.tsx` with a "Browse servers" link back to the homepage, consistent with the site's design.
  - File: `packages/web/src/app/not-found.tsx`

- [x] **Add loading states** — Created skeleton loading states for both the homepage and server detail page routes, matching the layout structure of each page.
  - Files: `packages/web/src/app/loading.tsx`, `packages/web/src/app/servers/[id]/loading.tsx`

- [x] **Add ARIA labels and keyboard navigation** — Added `aria-label` to search input, `aria-hidden` to decorative search icon SVG, `role="group"` + `aria-label` to category filter container, `aria-pressed` to all filter buttons, and `role="status"` + `aria-live="polite"` to the results count for screen reader announcements.
  - File: `packages/web/src/components/SearchBar.tsx`

- [x] **Replace deprecated clipboard fallback** — Extracted duplicated clipboard logic into a reusable `useClipboard()` hook. Both `ConfigViewer` and `PackageManagerCommand` now use the shared hook. The fallback textarea approach is improved (visually hidden with `position: fixed; opacity: 0` instead of briefly visible).
  - Files: `packages/web/src/hooks/use-clipboard.ts` (new), `packages/web/src/components/ConfigViewer.tsx`, `packages/web/src/components/PackageManagerCommand.tsx`

- [x] **Update website to reflect all 19 apps and new CLI features** — Made app counts dynamic using `getAppIds().length` on homepage, OG image, and docs page. Added 7 missing apps to docs supported apps table. Added new CLI commands (update, doctor, import, sync, --json) to getting started section. Added "Project manifests" documentation section for `getmcp.json` and the `sync` command. Fixed stale workspace dependency versions (`^0.1.0` → `*`) that caused npm to install old published packages instead of using workspace symlinks.
  - Files: `packages/web/src/app/page.tsx`, `packages/web/src/app/opengraph-image.tsx`, `packages/web/src/app/docs/page.tsx`, `packages/generators/package.json`, `packages/registry/package.json`, `packages/cli/package.json`

- [ ] **Add light mode / theme toggle** — The site is dark-mode only with hardcoded dark colors. Add light theme support or respect `prefers-color-scheme` media query.
  - File: `packages/web/src/app/globals.css`

---

## 7. Low — Code Cleanup

Refactoring and hygiene improvements.

- [ ] **Extract unreachable throw to `BaseGenerator`** — Every generator has an identical unreachable `else { throw new Error("Invalid config: must have either 'command' or 'url'") }` branch, duplicated 19 times. Move this guard into `BaseGenerator` and simplify the generator interface.
  - Files: all 19 generators in `packages/generators/src/`

- [ ] **Simplify `*Type` export naming in core** — `core/index.ts` exports types with `*Type` suffixes (e.g., `LooseServerConfigType`) to avoid collision with Zod schema names. Consider namespace-based exports or separate entry points for schemas vs types.
  - File: `packages/core/src/index.ts`

- [x] **Add Zod validation at registry registration** — Added `RegistryEntry.parse(entry)` in the `register()` function for runtime validation.
  - File: `packages/registry/src/index.ts`

- [x] **Update stale numbers in SPECIFICATION.md** — Updated all references to reflect the current state (12 apps, 331 tests, 11 test files).
  - File: `SPECIFICATION.md`

- [ ] **Implement platform override handling** — `RegistryEntry` schema supports `windows`/`linux`/`macos` override fields but no generator or CLI code uses them. The CLI should apply platform-specific `command`/`args`/`env` overrides when generating configs (e.g., `cmd /c npx` on Windows).
  - Files: `packages/generators/src/base.ts`, `packages/cli/src/commands/add.ts`

---

## 8. Low — Future Features

Longer-term roadmap items from the specification.

### New AI App Support

- [x] **Amazon Q** — Added `amazon-q` generator (near-passthrough, `mcpServers` root key).
  - File: `packages/generators/src/amazon-q.ts`
- [x] **Gemini CLI** — Added `gemini-cli` generator (near-passthrough, `mcpServers` root key).
  - File: `packages/generators/src/gemini-cli.ts`
- [ ] **JetBrains AI** — Broader support beyond PyCharm (medium priority per spec)
- [ ] **LM Studio** — Research config format and add generator (low priority per spec)
- [x] **Continue** — Added `continue` generator (near-passthrough, `mcpServers` root key).
  - File: `packages/generators/src/continue.ts`
- [x] **Trae** — Added `trae` generator (project-scoped, `mcpServers` root key).
  - File: `packages/generators/src/trae.ts`
- [x] **VS Code Insiders** — Added `vscode-insiders` generator (reuses VS Code logic, `servers` root key).
  - File: `packages/generators/src/vscode-insiders.ts`
- [x] **Bolt AI** — Added `bolt-ai` generator (macOS only, `mcpServers` root key).
  - File: `packages/generators/src/bolt-ai.ts`
- [x] **LibreChat** — Added `libre-chat` generator (YAML format, `mcpServers` root key).
  - File: `packages/generators/src/libre-chat.ts`
- [x] **Antigravity** — Added `antigravity` generator (passthrough, `mcpServers` root key).
  - File: `packages/generators/src/antigravity.ts`

### Codex Enhancements

- [ ] **Codex-specific config fields** — Support additional fields in the Codex generator: `enabled`, `required`, `enabled_tools`, `disabled_tools`, `tool_timeout_sec`, `bearer_token_env_var`, `env_vars`, `env_http_headers`
  - File: `packages/generators/src/codex.ts`

- [ ] **OAuth support for remote MCP servers** — Integrate with Codex's `codex mcp login` flow. Add guidance or CLI support for OAuth-authenticated servers, including the optional `mcp_oauth_callback_port` top-level config.

- [x] **Project-scoped Codex config** — Codex supports `.codex/config.toml` for project-level config. Implemented as part of the broader scope selection feature (see Section 4).
  - Files: `packages/generators/src/codex.ts`, `packages/cli/src/detect.ts`

### Registry Enhancements

- [x] **JSON Schema for server definitions** — Published a JSON Schema (`packages/core/registry-entry.schema.json`) generated from the Zod schema via `zod-to-json-schema`. Available as a runtime function (`getRegistryEntryJsonSchema()`) and as a static file via subpath export.
  - Files: `packages/core/src/json-schema.ts`, `packages/core/scripts/generate-schema.ts`, `packages/core/registry-entry.schema.json`
- [ ] **Version tracking per server** — Track and display server package versions
- [ ] **Server compatibility matrix** — Surface which servers work with which apps
- [x] **Community submission workflow** — Created `CONTRIBUTING.md` guide, `.github/PULL_REQUEST_TEMPLATE/server-submission.md` PR template, and `.github/workflows/validate-server.yml` GitHub Action that validates registry entries and auto-labels server submission PRs.
  - Files: `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE/server-submission.md`, `.github/workflows/validate-server.yml`

### Web Directory Stretch Goals

- [ ] **Server popularity / leaderboard** — Rank servers by usage, downloads, or community votes.
- [ ] **Community submissions via web** — A web form or GitHub PR-based flow for adding new servers directly from the web directory.
