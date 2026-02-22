/**
 * Shared app selection and scope selection helpers.
 *
 * Used by `add`, `sync`, and `addUnverifiedServer` to resolve
 * which apps and scope to use based on flags, detection, and prompts.
 */

import * as p from "@clack/prompts";
import { getAppIds } from "@getmcp/generators";
import type { AppIdType } from "@getmcp/core";
import { detectApps, resolveAppForScope, type DetectedApp } from "./detect.js";
import { InvalidAppError, AppNotDetectedError } from "./errors.js";

export interface AppSelectionFlags {
  apps?: string[];
  allApps?: boolean;
  global?: boolean;
  project?: boolean;
}

/**
 * Resolve target apps based on CLI flags.
 *
 * Returns the filtered list of apps, or null if resolution failed
 * (after logging the appropriate error).
 *
 * Handles:
 *   --all-apps: all detected apps
 *   --app <id>: validate + filter by ID
 *   default: all detected apps (for non-interactive fallback)
 */
export function resolveAppsFromFlags(
  flags: AppSelectionFlags,
): { apps: DetectedApp[]; allApps: DetectedApp[] } | null {
  const allApps = detectApps();
  const detected = allApps.filter((app) => app.exists);

  if (flags.allApps) {
    if (detected.length === 0) {
      p.log.error(new AppNotDetectedError().format());
      return null;
    }
    return { apps: detected, allApps };
  }

  if (flags.apps && flags.apps.length > 0) {
    const validIds = getAppIds();
    const selectedApps: DetectedApp[] = [];

    for (const appId of flags.apps) {
      if (!validIds.includes(appId as AppIdType)) {
        p.log.error(new InvalidAppError(appId, validIds).format());
        process.exit(1);
      }
      const app = allApps.find((a) => a.id === appId);
      if (app) {
        selectedApps.push(app);
      } else {
        p.log.warn(`App "${appId}" has no config path for this platform. Skipping.`);
      }
    }

    if (selectedApps.length === 0) {
      p.log.error("None of the specified apps are available on this platform.");
      process.exit(1);
    }
    return { apps: selectedApps, allApps };
  }

  // Default: return all detected apps
  return { apps: detected, allApps };
}

/**
 * Resolve scope for dual-scope apps based on CLI flags.
 *
 * Returns the updated apps list with config paths resolved for the chosen scope.
 *
 * Handles:
 *   --global: "global"
 *   --project: "project"
 *   non-interactive default: "project"
 *   interactive: prompts user
 */
export async function resolveScope(
  apps: DetectedApp[],
  flags: AppSelectionFlags,
  isNonInteractive: boolean,
): Promise<{ apps: DetectedApp[]; scope: "project" | "global" }> {
  const dualScopeApps = apps.filter((a) => a.supportsBothScopes);
  if (dualScopeApps.length === 0) return { apps, scope: "project" };

  let chosenScope: "project" | "global";
  if (flags.global) {
    chosenScope = "global";
  } else if (flags.project) {
    chosenScope = "project";
  } else if (isNonInteractive) {
    chosenScope = "project";
  } else {
    const scopeChoice = await p.select({
      message: "Install globally or per-project?",
      options: [
        { label: "Project", hint: "config in current directory", value: "project" as const },
        { label: "Global", hint: "config in home directory", value: "global" as const },
      ],
      initialValue: "project" as const,
    });
    if (p.isCancel(scopeChoice)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    chosenScope = scopeChoice;
  }

  return { apps: apps.map((app) => resolveAppForScope(app, chosenScope)), scope: chosenScope };
}
