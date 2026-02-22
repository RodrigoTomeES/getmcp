/**
 * `getmcp update` command.
 *
 * Re-generates and merges configs for all tracked installations
 * using the current registry definitions.
 */

import * as p from "@clack/prompts";
import { getServer } from "@getmcp/registry";
import { getGenerator } from "@getmcp/generators";
import type { LooseServerConfigType, AppIdType } from "@getmcp/core";
import { getTrackedServers, trackInstallation } from "../lock.js";
import { detectApps } from "../detect.js";
import { mergeServerIntoConfig, writeConfigFile } from "../config-file.js";
import { shortenPath, isNonInteractive as checkNonInteractive } from "../utils.js";
import { formatError } from "../errors.js";

export interface UpdateOptions {
  yes?: boolean;
  apps?: string[];
  allApps?: boolean;
  dryRun?: boolean;
  global?: boolean;
  project?: boolean;
}

export async function updateCommand(options: UpdateOptions = {}): Promise<void> {
  const isNonInteractive = checkNonInteractive(options);

  p.intro("getmcp update");

  const lock = getTrackedServers();
  const entries = Object.entries(lock.installations);

  if (entries.length === 0) {
    p.log.info("No tracked installations to update. Use 'getmcp add' to install servers.");
    p.outro("Done");
    return;
  }

  const allApps = detectApps();
  const appMap = new Map(allApps.map((a) => [a.id, a]));

  // Confirm update
  if (!isNonInteractive) {
    const confirmed = await p.confirm({
      message: `Update ${entries.length} tracked server(s)?`,
      initialValue: true,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  if (options.dryRun) {
    p.log.step("Dry run — no files will be modified:");
  }

  const spin = p.spinner();
  spin.start("Updating configurations...");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [serverId, installation] of entries) {
    const registryEntry = getServer(serverId);

    if (!registryEntry) {
      spin.stop(`${serverId}: skipped (no longer in registry)`);
      p.log.warn(`${serverId}: not found in registry, skipping`);
      skipped++;
      spin.start("Continuing...");
      continue;
    }

    const config = structuredClone(registryEntry.config) as LooseServerConfigType;

    // Determine which apps to update
    let targetAppIds: AppIdType[];

    if (options.apps && options.apps.length > 0) {
      targetAppIds = installation.apps.filter((id) => options.apps!.includes(id));
    } else {
      targetAppIds = installation.apps;
    }

    for (const appId of targetAppIds) {
      const app = appMap.get(appId);
      if (!app) {
        p.log.warn(`  ${serverId} → ${appId}: app not available on this platform`);
        skipped++;
        continue;
      }

      try {
        const generator = getGenerator(app.id);
        const generatedConfig = generator.generate(serverId, config);

        if (options.dryRun) {
          spin.stop(`Preview: ${registryEntry.name} → ${app.name}`);
          const serialized = generator.serialize(generatedConfig);
          p.note(
            `File: ${shortenPath(app.configPath)}\n\n${serialized}`,
            `${registryEntry.name} → ${app.name}`,
          );
          spin.start("Continuing...");
        } else {
          const merged = mergeServerIntoConfig(app.configPath, generatedConfig);
          writeConfigFile(app.configPath, merged);
        }
        updated++;
      } catch (err) {
        p.log.error(`  ${registryEntry.name} → ${app.name}: ${formatError(err)}`);
        failed++;
      }
    }

    // Update tracking timestamp
    if (!options.dryRun) {
      trackInstallation(
        serverId,
        targetAppIds,
        installation.envVars,
        undefined,
        installation.scopes,
      );
    }
  }

  spin.stop("Update complete.");

  p.outro(`Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}
