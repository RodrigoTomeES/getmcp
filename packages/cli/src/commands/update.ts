/**
 * `getmcp update` command.
 *
 * Re-generates and merges configs for all tracked installations
 * using the current registry definitions.
 */

import * as p from "@clack/prompts";
import { getServer } from "@getmcp/registry";
import { getGenerator } from "@getmcp/generators";
import { isStdioConfig } from "@getmcp/core";
import type { LooseServerConfigType, AppIdType } from "@getmcp/core";
import { getTrackedServers, trackInstallation } from "../lock.js";
import { detectApps } from "../detect.js";
import {
  mergeServerIntoConfig,
  writeConfigFile,
  readConfigFile,
  ROOT_KEYS,
} from "../config-file.js";
import { shortenPath, isNonInteractive as isNonInteractiveCheck } from "../utils.js";
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
  const isNonInteractive = isNonInteractiveCheck(options);

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

    // Preserve existing env var values from current configs
    if (isStdioConfig(config) && config.env) {
      for (const appId of installation.apps) {
        const app = appMap.get(appId);
        if (!app) continue;
        try {
          const existingConfig = readConfigFile(app.configPath);
          for (const rootKey of ROOT_KEYS) {
            const section = existingConfig[rootKey] as Record<string, unknown> | undefined;
            if (!section || typeof section !== "object") continue;
            const serverSection = section[serverId] as Record<string, unknown> | undefined;
            if (!serverSection || typeof serverSection !== "object") continue;
            const existingEnv = serverSection.env as Record<string, string> | undefined;
            if (!existingEnv) continue;
            // Merge non-empty existing values into the new config
            for (const [key, val] of Object.entries(existingEnv)) {
              if (val && key in config.env!) {
                config.env![key] = val;
              }
            }
            break; // Found env values, no need to check more root keys
          }
          break; // Only need values from one app's config
        } catch {
          // Config not readable, skip
        }
      }
    }

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
