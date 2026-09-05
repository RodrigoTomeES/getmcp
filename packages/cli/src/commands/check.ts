/**
 * `getmcp check` command.
 *
 * Compares the lock file against the current registry to show
 * which tracked servers are still available, and reports any
 * apps where the server may have been removed externally.
 */

import * as p from "@clack/prompts";
import { getServer } from "@getmcp/registry";
import { getTrackedServers } from "../lock.js";
import {
  detectApps,
  resolveAppForScope,
  getReadableConfigPaths,
  type DetectedApp,
} from "../detect.js";
import { listServersInConfig } from "../config-file.js";
import { shortenPath } from "../utils.js";

export interface CheckOptions {
  json?: boolean;
}

interface ServerLookup {
  status: "present" | "missing" | "unreadable";
  path?: string;
}

/**
 * Look for a tracked server in an app's config.
 *
 * When the lock file records the scope, only that scope is checked — that is
 * where `add` wrote it. Entries predating scope tracking have no recorded
 * scope; rather than assuming "project" and reporting a global install as
 * missing, every config the app actually has is searched.
 */
function lookupServer(
  app: DetectedApp,
  serverId: string,
  recordedScope: "project" | "global" | undefined,
): ServerLookup {
  if (recordedScope) {
    const resolved = resolveAppForScope(app, recordedScope);
    try {
      const servers = listServersInConfig(resolved.configPath);
      return servers.includes(serverId)
        ? { status: "present", path: resolved.configPath }
        : { status: "missing" };
    } catch {
      return { status: "unreadable" };
    }
  }

  let unreadable = false;
  for (const { path } of getReadableConfigPaths(app)) {
    try {
      if (listServersInConfig(path).includes(serverId)) {
        return { status: "present", path };
      }
    } catch {
      unreadable = true;
    }
  }

  return unreadable ? { status: "unreadable" } : { status: "missing" };
}

export async function checkCommand(options: CheckOptions = {}): Promise<void> {
  const lock = getTrackedServers();
  const entries = Object.entries(lock.installations);

  const allDetectedApps = detectApps();
  const installedAppIds = new Set(allDetectedApps.filter((a) => a.exists).map((a) => a.id));
  const appConfigMap = new Map(allDetectedApps.map((a) => [a.id, a]));

  if (options.json) {
    const results = entries.map(([serverId, installation]) => {
      const registryEntry = getServer(serverId);
      const inRegistry = !!registryEntry;

      const appStatuses = installation.apps.map((appId) => {
        const appScope = installation.scopes?.[appId] ?? "project";
        if (!installedAppIds.has(appId)) {
          return { app: appId, scope: appScope, status: "app-not-detected" as const };
        }
        const app = appConfigMap.get(appId)!;
        const lookup = lookupServer(app, serverId, installation.scopes?.[appId]);
        return { app: appId, scope: appScope, status: lookup.status };
      });

      return {
        serverId,
        name: registryEntry?.name ?? serverId,
        inRegistry,
        installedAt: installation.installedAt,
        ...(installation.registry ? { registry: installation.registry } : {}),
        apps: appStatuses,
      };
    });

    console.log(JSON.stringify(results, null, 2));
    return;
  }

  p.intro("getmcp check");

  if (entries.length === 0) {
    p.log.info("No tracked installations. Use 'getmcp add' to install servers.");
    p.outro("Done");
    return;
  }

  p.log.info(`Tracked installations: ${entries.length}`);

  let issues = 0;

  for (const [serverId, installation] of entries) {
    const registryEntry = getServer(serverId);

    if (!registryEntry) {
      const registryNote = installation.registry ? ` (registry: ${installation.registry})` : "";
      p.log.warn(
        `${serverId}: no longer in registry${registryNote}\n` +
          `  Installed in: ${installation.apps.join(", ")}\n` +
          `  Installed at: ${installation.installedAt}`,
      );
      issues++;
      continue;
    }

    // Check if the server is still configured in each tracked app
    const missingFrom: string[] = [];
    const presentIn: string[] = [];

    for (const appId of installation.apps) {
      if (!installedAppIds.has(appId)) {
        missingFrom.push(`${appId} (app not detected)`);
        continue;
      }

      const app = appConfigMap.get(appId)!;
      const lookup = lookupServer(app, serverId, installation.scopes?.[appId]);

      if (lookup.status === "present") {
        presentIn.push(`${app.name} (${shortenPath(lookup.path!)})`);
      } else if (lookup.status === "unreadable") {
        missingFrom.push(`${app.name} (config not readable)`);
      } else {
        missingFrom.push(`${app.name} (removed from config)`);
      }
    }

    if (missingFrom.length > 0) {
      p.log.warn(
        `${registryEntry.name} (${serverId}):\n` +
          `  Present in: ${presentIn.length > 0 ? presentIn.join(", ") : "(none)"}\n` +
          `  Missing from: ${missingFrom.join(", ")}`,
      );
      issues++;
    } else {
      p.log.success(
        `${registryEntry.name} (${serverId}): OK\n` + `  Configured in: ${presentIn.join(", ")}`,
      );
    }
  }

  if (issues > 0) {
    p.outro(`${issues} issue(s) found. Run 'getmcp update' to re-apply configurations.`);
  } else {
    p.outro("All installations are up to date.");
  }
}
