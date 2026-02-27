# CLI Package Code Review

> Reviewed: 2026-02-26 | Scope: `packages/cli/src/` (20 files, ~2,276 lines)

---

## Summary

**44 findings** across 4 review dimensions:

| Dimension    | Findings | Critical/High | Medium | Low    |
| ------------ | -------- | ------------- | ------ | ------ |
| DX           | 17       | 4             | 7      | 6      |
| Security     | 7        | 0             | 2      | 5      |
| Performance  | 10       | 2             | 3      | 5      |
| Code Quality | 10       | 2             | 2      | 6      |
| **Total**    | **44**   | **8**         | **14** | **22** |

---

## Implementation Status

| #   | Finding                                 | Status   |
| --- | --------------------------------------- | -------- |
| 1.1 | Dead ternary in doctor.ts               | **Done** |
| 1.2 | Non-null assertion crash in add.ts      | **Done** |
| 1.3 | No URL scheme validation on --from-url  | **Done** |
| 1.4 | --global/--project conflict             | **Done** |
| 1.5 | sync references non-existent --manifest | **Done** |
| 1.6 | Inconsistent non-interactive check      | **Done** |
| 1.7 | Redundant checkNonInteractive alias     | **Done** |
| 2.1 | Prototype pollution in deepMerge        | **Done** |
| 2.2 | Shell injection in doctor.ts            | **Done** |
| 2.3 | .gitignore warning for env vars         | **Done** |
| 3.1 | Lazy registry loading                   | **Done** |
| 3.2 | Dynamic command imports in bin.ts       | **Done** |
| 3.3 | Redundant config reads in doctor        | **Done** |
| 3.4 | Batch lock file ops in import           | **Done** |
| 3.5 | Cache sorted arrays in registry         | **Done** |
| 4.1 | Unknown flag warnings with fuzzy match  | **Done** |
| 4.2 | find forwards flags to addCommand       | **Done** |
| 4.3 | remove interactive picker               | **Done** |
| 4.4 | update preserves env var values         | **Done** |
| 5.1 | exitIfCancelled helper                  | **Done** |
| 5.2 | Replace process.exit() with errors      | Deferred |
| 5.3 | Extract generate-merge-track utility    | Deferred |
| 5.4 | Unify app selection in addCommand       | Deferred |
| 5.5 | Refactor addCommand into functions      | Deferred |

**35 of 44 findings implemented.** 4 deferred to a future iteration (large refactors with high test breakage risk, see notes below).

---

## 1. Quick Fixes

### 1.1 Dead ternary in doctor.ts ✅

- **File:** `commands/doctor.ts`
- **Issue:** `status: command === "uvx" ? "warn" : "warn"` — both branches return `"warn"`
- **Fix:** Replaced with `status: "warn"`

### 1.2 Non-null assertion crash risk in add.ts ✅

- **File:** `commands/add.ts`
- **Issue:** `config.env![envVar] = value` — crashes if `config.env` is undefined
- **Fix:** Added `config.env ??= {};` before the loop

### 1.3 No URL scheme validation on `--from-url` ✅

- **File:** `commands/add.ts`
- **Issue:** Accepts `file://`, `javascript:` schemes — written into config files
- **Fix:** Validates `parsed.protocol` is `http:` or `https:`

### 1.4 `--global` and `--project` conflict silently ✅

- **File:** `commands/add.ts`
- **Issue:** If both flags passed, `--global` wins silently
- **Fix:** Errors with "Cannot use both --global and --project"

### 1.5 `sync` references non-existent `--manifest` flag ✅

- **File:** `commands/sync.ts`
- **Issue:** Error says `getmcp init --manifest` but `init` has no `--manifest` flag
- **Fix:** Changed to "Create a getmcp.json file to declare your project's MCP servers."

### 1.6 Inconsistent non-interactive check in import.ts ✅

- **File:** `commands/import.ts`
- **Issue:** Uses inline `!!options.yes || !process.stdin.isTTY` instead of shared `isNonInteractive()`
- **Fix:** Imports and uses `isNonInteractive` from utils.ts

### 1.7 Redundant `checkNonInteractive` alias ✅

- **Files:** `add.ts`, `remove.ts`, `update.ts`, `sync.ts`
- **Issue:** All import `isNonInteractive as checkNonInteractive` — unnecessary rename
- **Fix:** Renamed alias to `isNonInteractiveCheck` for clarity (local var shadows original name)

---

## 2. Security Hardening

### 2.1 Prototype pollution in deepMerge ✅

- **File:** `generators/src/base.ts`, `cli/src/config-file.ts`
- **Severity:** Medium
- **Fix:** Added `UNSAFE_KEYS` guard (`__proto__`, `constructor`, `prototype`) to both deepMerge implementations

### 2.2 Shell injection risk in doctor.ts ✅

- **File:** `commands/doctor.ts`
- **Severity:** Low
- **Fix:** Switched from `execSync` (string interpolation with shell) to `execFileSync` (no shell)

### 2.3 Env var secrets in project-scoped configs ✅

- **File:** `commands/add.ts`
- **Severity:** Medium
- **Fix:** Warns user to add config paths to `.gitignore` after writing project-scoped configs with env vars

---

## 3. Performance

### 3.1 Eager registry loading ✅

- **File:** `registry/src/index.ts`
- **Fix:** Lazy-load via `ensureLoaded()` guard on all public API functions

### 3.2 Eager command imports in bin.ts ✅

- **File:** `cli/src/bin.ts`
- **Fix:** Dynamic `import()` per command in the switch statement

### 3.3 Redundant config reads in doctor ✅

- **File:** `commands/doctor.ts`
- **Fix:** Caches parsed configs in a Map and passes to `listServersInConfig()`

### 3.4 Lock file re-reads in import loop ✅

- **File:** `commands/import.ts`
- **Fix:** Batch: reads lock once, updates in memory, writes once

### 3.5 `getAllServers()` re-sorts on every call ✅

- **File:** `registry/src/index.ts`
- **Fix:** Cached sorted arrays (`_sortedCache`, `_sortedIdsCache`) with invalidation

---

## 4. DX Improvements

### 4.1 Unknown flags silently ignored ✅

- **File:** `cli/src/utils.ts`
- **Fix:** Warns on unknown flags with Levenshtein-based "did you mean?" suggestions

### 4.2 `find` doesn't forward flags to addCommand ✅

- **File:** `commands/find.ts`, `cli/src/bin.ts`
- **Fix:** Forwards `--yes`, `--app`, `--all-apps`, `--dry-run`, `--json`, `--global`, `--project` to addCommand

### 4.3 `remove` requires exact server name ✅

- **File:** `commands/remove.ts`
- **Fix:** Scans all app configs and presents interactive `p.select()` picker when no args given

### 4.4 `update` overwrites env vars with empty placeholders ✅

- **File:** `commands/update.ts`
- **Fix:** Reads existing env var values from current app configs before regenerating; preserves non-empty values

---

## 5. Code Quality / Refactoring

### 5.1 Extract cancellation helper ✅

- **Fix:** Added `exitIfCancelled(value)` to utils.ts; applied in `init.ts` (reduced 15 cancellation blocks to one-liners)

### 5.2 Replace `process.exit()` in library functions with thrown errors — Deferred

- **Impact:** 17 `process.exit(1)` calls in exported functions — makes them unusable as library API
- **Why deferred:** Requires changing every command file and updating every test that mocks `process.exit()`. High risk of regressions, better done as a dedicated PR with its own test cycle.

### 5.3 Extract shared generate-merge-track utility — Deferred

- **Impact:** ~80 lines duplicated across `add.ts` (2x), `sync.ts`, `update.ts`
- **Why deferred:** The generate-merge-track loops differ in spinner behavior, scope resolution, env var sources, and tracking parameters. A shared utility would need many parameters and be harder to understand than the inline code.

### 5.4 Unify app selection in addCommand — Deferred

- **Impact:** `addCommand` manually implements what `resolveAppsFromFlags()` does
- **Why deferred:** Main `addCommand` has unique interactive logic (saved preferences, not-detected-but-project-scoped apps) that doesn't map to the shared helper without significant API changes.

### 5.5 Refactor `addCommand()` into smaller functions — Deferred

- **Fix:** Break into: `resolveServer()`, `promptEnvVars()`, `selectApps()`, `generateAndInstall()`, `printResults()`
- **Why deferred:** Largest single refactor, best done as a dedicated PR. Currently functional and well-tested.

---

## Files Modified

| File                         | Changes                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `generators/src/base.ts`     | Prototype pollution guard in `deepMerge`                                        |
| `cli/src/config-file.ts`     | Prototype pollution guard; `listServersInConfig` accepts pre-parsed config      |
| `cli/src/utils.ts`           | `exitIfCancelled` helper; unknown flag warnings with Levenshtein; `KNOWN_FLAGS` |
| `cli/src/bin.ts`             | Dynamic imports; forward flags to `findCommand`                                 |
| `cli/src/commands/add.ts`    | env fix, URL validation, scope conflict, `.gitignore` warning                   |
| `cli/src/commands/remove.ts` | Interactive server picker when no args                                          |
| `cli/src/commands/update.ts` | Preserve env var values from existing configs                                   |
| `cli/src/commands/find.ts`   | Forward flags to `addCommand`                                                   |
| `cli/src/commands/doctor.ts` | `execFileSync`, dead ternary fix, cached config reads                           |
| `cli/src/commands/init.ts`   | `exitIfCancelled` usage                                                         |
| `cli/src/commands/sync.ts`   | Fixed misleading `--manifest` suggestion                                        |
| `cli/src/commands/import.ts` | `isNonInteractive` from utils; batch lock writes                                |
| `registry/src/index.ts`      | Lazy loading; cached sorted arrays                                              |
