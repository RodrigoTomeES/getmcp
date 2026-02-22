/**
 * `getmcp sync` command.
 *
 * Reads a project manifest (getmcp.json) and installs all declared
 * servers into detected AI applications.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as p from "@clack/prompts";
import { ProjectManifest } from "@getmcp/core";
import { getServer } from "@getmcp/registry";
import { getGenerator, getAppIds, generators } from "@getmcp/generators";
import type { LooseServerConfigType, AppIdType } from "@getmcp/core";
import { detectApps, resolveAppForScope, type DetectedApp } from "../detect.js";
import { mergeServerIntoConfig, writeConfigFile } from "../config-file.js";
import { trackInstallation } from "../lock.js";
import { getSavedSelectedApps, saveSelectedApps } from "../preferences.js";
import { shortenPath, isNonInteractive as checkNonInteractive } from "../utils.js";
import { InvalidAppError, formatError } from "../errors.js";

export interface SyncOptions {
  yes?: boolean;
  apps?: string[];
  allApps?: boolean;
  dryRun?: boolean;
  json?: boolean;
  global?: boolean;
  project?: boolean;
  /** Override manifest path (for testing) */
  manifestPath?: string;
}

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
  const manifestPath = options.manifestPath ?? path.resolve("getmcp.json");

  if (!fs.existsSync(manifestPath)) {
    if (options.json) {
      console.log(JSON.stringify({ error: "getmcp.json not found" }, null, 2));
    } else {
      p.intro("getmcp sync");
      p.log.error("No getmcp.json found in current directory.");
      p.log.info("Create one with: getmcp init --manifest");
      p.outro("Done");
    }
    return;
  }

  // Parse manifest
  let manifest;
  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = ProjectManifest.parse(JSON.parse(raw));
  } catch (err) {
    if (options.json) {
      console.log(
        JSON.stringify(
          { error: `Invalid getmcp.json: ${err instanceof Error ? err.message : String(err)}` },
          null,
          2,
        ),
      );
    } else {
      p.intro("getmcp sync");
      p.log.error(`Invalid getmcp.json: ${err instanceof Error ? err.message : String(err)}`);
      p.outro("Done");
    }
    return;
  }

  const serverIds = Object.keys(manifest.servers);

  if (serverIds.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ servers: [], results: [] }, null, 2));
    } else {
      p.intro("getmcp sync");
      p.log.info("No servers declared in getmcp.json.");
      p.outro("Done");
    }
    return;
  }

  const isNonInteractive = checkNonInteractive(options);

  if (!options.json) {
    p.intro("getmcp sync");
  }

  // Resolve target apps
  const allApps = detectApps();
  const detected = allApps.filter((app) => app.exists);
  let defaultApps: DetectedApp[];

  if (options.allApps) {
    defaultApps = detected;
  } else if (options.apps && options.apps.length > 0) {
    const validIds = getAppIds();
    defaultApps = [];
    for (const appId of options.apps) {
      if (!validIds.includes(appId as AppIdType)) {
        if (!options.json) {
          p.log.error(new InvalidAppError(appId, validIds).format());
        }
        process.exit(1);
      }
      const app = allApps.find((a) => a.id === appId);
      if (app) defaultApps.push(app);
    }
  } else if (isNonInteractive) {
    defaultApps = detected;
  } else {
    const notDetectedProjectScoped = allApps.filter(
      (app) => !app.exists && generators[app.id].app.configPaths !== null,
    );

    if (detected.length === 0 && notDetectedProjectScoped.length === 0) {
      p.log.warn("No AI applications detected on this system.");
      p.outro("Done");
      return;
    }

    const savedApps = getSavedSelectedApps();
    const hasSavedPreferences = savedApps !== null;

    const choices = [
      ...detected.map((app) => ({
        label: app.name,
        value: app,
        hint: shortenPath(app.configPath),
      })),
      ...notDetectedProjectScoped.map((app) => ({
        label: app.name,
        value: app,
        hint: `${shortenPath(app.configPath)} (not detected)`,
      })),
    ];

    const initialValues = choices
      .filter((c) => (hasSavedPreferences ? savedApps.includes(c.value.id) : c.value.exists))
      .map((c) => c.value);

    const initialIds = new Set(initialValues.map((v) => v.id));
    choices.sort((a, b) => {
      const aSelected = initialIds.has(a.value.id) ? 0 : 1;
      const bSelected = initialIds.has(b.value.id) ? 0 : 1;
      return aSelected - bSelected;
    });

    const selected = await p.multiselect({
      message: "Select apps to sync:",
      options: choices,
      initialValues,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    defaultApps = selected;
    saveSelectedApps(defaultApps.map((app) => app.id));
  }

  if (!options.json) {
    p.log.info(`Syncing ${serverIds.length} server(s) from getmcp.json`);
  }

  if (options.dryRun && !options.json) {
    p.log.step("Dry run — showing what would be written:\n");
  }

  const results: {
    serverId: string;
    ok: boolean;
    apps: string[];
    error?: string;
  }[] = [];

  for (const serverId of serverIds) {
    const serverOverrides = manifest.servers[serverId];
    const registryEntry = getServer(serverId);

    if (!registryEntry) {
      results.push({ serverId, ok: false, apps: [], error: "Not found in registry" });
      if (!options.json) {
        p.log.warn(`"${serverId}": not found in registry, skipping.`);
      }
      continue;
    }

    // Build config with overrides
    const config = structuredClone(registryEntry.config) as LooseServerConfigType;
    if (serverOverrides && "env" in serverOverrides && serverOverrides.env) {
      if ("command" in config && config.env) {
        Object.assign(config.env, serverOverrides.env);
      }
    }

    // Determine target apps for this server
    let targetApps: DetectedApp[];
    if (serverOverrides && "apps" in serverOverrides && serverOverrides.apps) {
      targetApps = defaultApps.filter((a) => serverOverrides.apps!.includes(a.id));
    } else {
      targetApps = defaultApps;
    }

    // Resolve scope for dual-scope apps
    const serverScope =
      (serverOverrides && "scope" in serverOverrides && serverOverrides.scope) ||
      (options.global ? "global" : "project");
    targetApps = targetApps.map((app) =>
      resolveAppForScope(app, serverScope as "project" | "global"),
    );

    const configuredApps: string[] = [];

    for (const app of targetApps) {
      try {
        const generator = getGenerator(app.id);
        const generatedConfig = generator.generate(registryEntry.id, config);

        if (options.dryRun) {
          if (!options.json) {
            const serialized = generator.serialize(generatedConfig);
            p.note(
              `File: ${shortenPath(app.configPath)}\n\n${serialized}`,
              `${registryEntry.name} → ${app.name}`,
            );
          }
        } else {
          const merged = mergeServerIntoConfig(app.configPath, generatedConfig);
          writeConfigFile(app.configPath, merged);
        }
        configuredApps.push(app.id);
      } catch (err) {
        if (!options.json) {
          p.log.error(`${registryEntry.name} → ${app.name}: ${formatError(err)}`);
        }
      }
    }

    if (configuredApps.length > 0 && !options.dryRun) {
      const scopes: Record<string, "project" | "global"> = {};
      for (const appId of configuredApps) {
        const app = targetApps.find((a) => a.id === appId);
        scopes[appId] = app?.supportsBothScopes ? (serverScope as "project" | "global") : "project";
      }
      trackInstallation(
        registryEntry.id,
        configuredApps as AppIdType[],
        registryEntry.requiredEnvVars,
        undefined,
        scopes,
      );
    }

    results.push({ serverId, ok: configuredApps.length > 0, apps: configuredApps });

    if (!options.json && configuredApps.length > 0) {
      p.log.success(`${registryEntry.name}: ${configuredApps.join(", ")}`);
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ servers: serverIds, results }, null, 2));
    return;
  }

  const succeeded = results.filter((r) => r.ok).length;
  const action = options.dryRun ? "would be synced" : "synced";
  p.outro(`${succeeded}/${serverIds.length} server(s) ${action}.`);
}
