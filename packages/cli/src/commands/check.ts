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
import { detectInstalledApps } from "../detect.js";
import { listServersInConfig } from "../config-file.js";
import { shortenPath } from "../utils.js";

export async function checkCommand(): Promise<void> {
  p.intro("getmcp check");

  const lock = getTrackedServers();
  const entries = Object.entries(lock.installations);

  if (entries.length === 0) {
    p.log.info("No tracked installations. Use 'getmcp add' to install servers.");
    p.outro("Done");
    return;
  }

  const installedApps = detectInstalledApps();
  const installedAppIds = new Set(installedApps.map((a) => a.id));
  const appConfigMap = new Map(installedApps.map((a) => [a.id, a]));

  p.log.info(`Tracked installations: ${entries.length}`);

  let issues = 0;

  for (const [serverId, installation] of entries) {
    const registryEntry = getServer(serverId);

    if (!registryEntry) {
      p.log.warn(
        `${serverId}: no longer in registry\n` +
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
      try {
        const servers = listServersInConfig(app.configPath);
        if (servers.includes(serverId)) {
          presentIn.push(`${app.name} (${shortenPath(app.configPath)})`);
        } else {
          missingFrom.push(`${app.name} (removed from config)`);
        }
      } catch {
        missingFrom.push(`${app.name} (config not readable)`);
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
        `${registryEntry.name} (${serverId}): OK\n` +
        `  Configured in: ${presentIn.join(", ")}`,
      );
    }
  }

  if (issues > 0) {
    p.outro(`${issues} issue(s) found. Run 'getmcp update' to re-apply configurations.`);
  } else {
    p.outro("All installations are up to date.");
  }
}
