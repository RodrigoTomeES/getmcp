/**
 * App auto-detection.
 *
 * Resolves platform-specific config paths and delegates installation
 * detection to each generator's `detectInstalled()` method.
 */

import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";
import { generators } from "@getmcp/generators";
import type { AppIdType, AppMetadata } from "@getmcp/core";
import { supportsBothScopes } from "@getmcp/core";

/**
 * Resolve platform-specific path placeholders.
 */
export function resolvePath(configPath: string): string {
  let resolved = configPath;

  // ~ → home directory
  if (resolved.startsWith("~/")) {
    resolved = path.join(os.homedir(), resolved.slice(2));
  }

  // %AppData% → Windows AppData\Roaming
  resolved = resolved.replace(
    /%AppData%/gi,
    process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"),
  );

  // %UserProfile% → Windows home
  resolved = resolved.replace(/%UserProfile%/gi, os.homedir());

  // %LocalAppData% → Windows AppData\Local
  resolved = resolved.replace(
    /%LocalAppData%/gi,
    process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  );

  // %XDGConfigHome% → XDG_CONFIG_HOME, else ~/.config (all platforms).
  // Mirrors `configHome` in @getmcp/generators so declared paths agree with
  // each generator's detectInstalled().
  resolved = resolved.replace(
    /%XDGConfigHome%/gi,
    process.env.XDG_CONFIG_HOME?.trim() || path.join(os.homedir(), ".config"),
  );

  return path.normalize(resolved);
}

/**
 * Get the resolved config path for an app on the current platform.
 *
 * - No scope: returns project path if available, else global path.
 * - "project": returns project path only.
 * - "global": returns global path only.
 */
export function getConfigPath(
  app: AppMetadata,
  requestedScope?: "project" | "global",
): string | undefined {
  const platform = process.platform as "win32" | "darwin" | "linux";

  if (requestedScope === "global") {
    const p = app.globalConfigPaths?.[platform];
    return p ? resolvePath(p) : undefined;
  }

  if (requestedScope === "project") {
    return app.configPaths ?? undefined;
  }

  // Default: project if available, else global
  if (app.configPaths) return app.configPaths;
  const globalPath = app.globalConfigPaths?.[platform];
  return globalPath ? resolvePath(globalPath) : undefined;
}

export interface DetectedApp {
  id: AppIdType;
  name: string;
  configPath: string;
  exists: boolean;
  supportsBothScopes: boolean;
  globalConfigPath?: string;
}

/**
 * Detect which AI apps are available by resolving config paths and
 * checking installation status via each generator's `detectInstalled()`.
 */
export function detectApps(): DetectedApp[] {
  const results: DetectedApp[] = [];

  for (const generator of Object.values(generators)) {
    const configPath = getConfigPath(generator.app);
    if (!configPath) continue;

    const hasBothScopes = supportsBothScopes(generator.app);
    const globalConfigPath = hasBothScopes ? getConfigPath(generator.app, "global") : undefined;

    results.push({
      id: generator.app.id,
      name: generator.app.name,
      configPath,
      exists: generator.detectInstalled(),
      supportsBothScopes: hasBothScopes,
      ...(globalConfigPath ? { globalConfigPath } : {}),
    });
  }

  return results;
}

/**
 * Get only the apps that appear to be installed.
 */
export function detectInstalledApps(): DetectedApp[] {
  return detectApps().filter((app) => app.exists);
}

/**
 * Resolve a detected app's config path for a specific scope.
 * For single-scope apps, returns the app unchanged.
 * For dual-scope apps, swaps the config path when global is chosen.
 */
export function resolveAppForScope(app: DetectedApp, scope: "project" | "global"): DetectedApp {
  if (!app.supportsBothScopes) return app;
  if (scope === "global" && app.globalConfigPath) {
    return { ...app, configPath: app.globalConfigPath };
  }
  return app;
}

/** A config file that exists on disk, together with the scope it belongs to. */
export interface ReadableConfig {
  scope: "project" | "global";
  path: string;
}

/**
 * Sibling filenames to probe for a declared config path.
 *
 * Apps whose format is "jsonc" accept both `.json` and `.jsonc`, but
 * `globalConfigPaths` can only declare one name per platform. OpenCode, for
 * example, loads `["opencode.json", "opencode.jsonc"]` in that order, so the
 * declared `.json` name is returned first and the sibling second.
 */
function configCandidates(declaredPath: string, format: AppMetadata["configFormat"]): string[] {
  if (format !== "jsonc") return [declaredPath];

  const ext = path.extname(declaredPath);
  const sibling =
    ext === ".json" ? `${declaredPath}c` : ext === ".jsonc" ? declaredPath.slice(0, -1) : undefined;

  return sibling ? [declaredPath, sibling] : [declaredPath];
}

/**
 * Every config file that actually exists on disk for an app, project first.
 *
 * Read-only commands (doctor, list, check) use this so they report the config
 * the user is actually running, rather than assuming project scope. Write
 * paths must NOT use this — they resolve scope explicitly via
 * `resolveAppForScope()`, because writing to a scope the user did not choose
 * would silently modify the wrong file.
 */
export function getReadableConfigPaths(app: DetectedApp): ReadableConfig[] {
  const format = generators[app.id]?.app.configFormat ?? "json";

  const declared: ReadableConfig[] = [{ scope: "project", path: app.configPath }];
  if (app.supportsBothScopes && app.globalConfigPath) {
    declared.push({ scope: "global", path: app.globalConfigPath });
  }

  const found: ReadableConfig[] = [];
  for (const { scope, path: declaredPath } of declared) {
    for (const candidate of configCandidates(declaredPath, format)) {
      if (fs.existsSync(candidate)) {
        found.push({ scope, path: candidate });
        break;
      }
    }
  }

  return found;
}
