/**
 * CLI preferences persistence.
 *
 * Remembers user choices (e.g. selected apps) across CLI invocations.
 * Stored in a platform-specific config directory:
 *   - Windows: %AppData%/getmcp/preferences.json
 *   - macOS/Linux: ~/.config/getmcp/preferences.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { AppIdType } from "@getmcp/core";

interface Preferences {
  selectedApps?: AppIdType[];
}

/**
 * Get the platform-specific path for the preferences file.
 */
export function getPreferencesPath(): string {
  if (process.platform === "win32") {
    const appData =
      process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "getmcp", "preferences.json");
  }

  // macOS and Linux: use XDG_CONFIG_HOME or ~/.config
  const configDir =
    process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(configDir, "getmcp", "preferences.json");
}

/**
 * Read the preferences file.
 * Returns an empty object if the file doesn't exist or is corrupt.
 */
export function readPreferences(
  filePath?: string,
): Preferences {
  const prefsPath = filePath ?? getPreferencesPath();

  if (!fs.existsSync(prefsPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(prefsPath, "utf-8");
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw);

    // Basic validation: must be an object
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    // Validate selectedApps if present
    if (
      parsed.selectedApps !== undefined &&
      (!Array.isArray(parsed.selectedApps) ||
        !parsed.selectedApps.every(
          (v: unknown) => typeof v === "string",
        ))
    ) {
      return {};
    }

    return parsed as Preferences;
  } catch {
    return {};
  }
}

/**
 * Save the list of selected app IDs to the preferences file.
 * Creates parent directories if they don't exist.
 */
export function saveSelectedApps(
  appIds: AppIdType[],
  filePath?: string,
): void {
  const prefsPath = filePath ?? getPreferencesPath();
  const existing = readPreferences(prefsPath);

  existing.selectedApps = appIds;

  const dir = path.dirname(prefsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    prefsPath,
    JSON.stringify(existing, null, 2) + "\n",
    "utf-8",
  );
}

/**
 * Get the previously saved list of selected app IDs.
 * Returns null if no preferences exist yet (first run).
 */
export function getSavedSelectedApps(
  filePath?: string,
): AppIdType[] | null {
  const prefs = readPreferences(filePath);
  return prefs.selectedApps ?? null;
}
