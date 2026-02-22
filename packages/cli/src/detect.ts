/**
 * App auto-detection.
 *
 * Resolves platform-specific config paths and delegates installation
 * detection to each generator's `detectInstalled()` method.
 */

import * as path from "node:path";
import * as os from "node:os";
import { generators } from "@getmcp/generators";
import type { AppIdType, AppMetadata } from "@getmcp/core";

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

  return path.normalize(resolved);
}

/**
 * Get the resolved config path for an app on the current platform.
 * Returns undefined if the app has no config path for this platform.
 */
export function getConfigPath(app: AppMetadata): string | undefined {
  const platform = process.platform as "win32" | "darwin" | "linux";
  const configPath = app.configPaths[platform];
  if (!configPath) return undefined;
  return resolvePath(configPath);
}

export interface DetectedApp {
  id: AppIdType;
  name: string;
  configPath: string;
  exists: boolean;
  scope: "project" | "global";
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

    results.push({
      id: generator.app.id,
      name: generator.app.name,
      configPath,
      exists: generator.detectInstalled(),
      scope: generator.app.scope,
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
