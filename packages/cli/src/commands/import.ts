/**
 * `getmcp import` command.
 *
 * Scans all detected AI apps for configured MCP servers,
 * cross-references with the registry, and adopts matching
 * servers into getmcp tracking (lock file).
 */

import * as p from "@clack/prompts";
import { getServer, findServerByCommand } from "@getmcp/registry";
import { detectInstalledApps } from "../detect.js";
import { readConfigFile, ROOT_KEYS } from "../config-file.js";
import { getTrackedServers, readLockFile, writeLockFile } from "../lock.js";
import { isNonInteractive as isNonInteractiveCheck } from "../utils.js";

export interface ImportOptions {
  yes?: boolean;
  json?: boolean;
}

interface DiscoveredServer {
  name: string;
  registryId: string | undefined;
  registryName: string | undefined;
  apps: string[];
}

export async function importCommand(options: ImportOptions = {}): Promise<void> {
  const isNonInteractive = isNonInteractiveCheck(options);
  const apps = detectInstalledApps();

  if (apps.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ apps: [], discovered: [], imported: [] }, null, 2));
    } else {
      p.intro("getmcp import");
      p.log.warn("No AI applications detected on this system.");
      p.outro("Done");
    }
    return;
  }

  // Scan all app configs for server entries
  const discovered = new Map<string, DiscoveredServer>();
  const lock = getTrackedServers();
  const rootKeys = ROOT_KEYS;

  for (const app of apps) {
    let config: Record<string, unknown>;
    try {
      config = readConfigFile(app.configPath);
    } catch {
      continue;
    }

    for (const rootKey of rootKeys) {
      const section = config[rootKey];
      if (typeof section !== "object" || section === null || Array.isArray(section)) continue;

      for (const [serverName, serverConfig] of Object.entries(section as Record<string, unknown>)) {
        const existing = discovered.get(serverName);
        if (existing) {
          if (!existing.apps.includes(app.id)) {
            existing.apps.push(app.id);
          }
          continue;
        }

        // Try to match to registry
        let registryMatch = getServer(serverName);

        if (
          !registryMatch &&
          typeof serverConfig === "object" &&
          serverConfig !== null &&
          "command" in serverConfig
        ) {
          const sc = serverConfig as { command: string; args?: string[] };
          registryMatch = findServerByCommand(sc.command, sc.args ?? []);
        }

        discovered.set(serverName, {
          name: serverName,
          registryId: registryMatch?.id,
          registryName: registryMatch?.name,
          apps: [app.id],
        });
      }
    }
  }

  // Filter out already-tracked servers
  const untracked = Array.from(discovered.values()).filter(
    (s) => !(s.name in lock.installations) && !(s.registryId && s.registryId in lock.installations),
  );

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          apps: apps.map((a) => a.id),
          discovered: Array.from(discovered.values()),
          untracked,
        },
        null,
        2,
      ),
    );
    return;
  }

  p.intro("getmcp import");

  if (discovered.size === 0) {
    p.log.info("No servers found in any app configurations.");
    p.outro("Done");
    return;
  }

  p.log.info(`Found ${discovered.size} server(s) across ${apps.length} app(s).`);

  if (untracked.length === 0) {
    p.log.success("All discovered servers are already tracked.");
    p.outro("Done");
    return;
  }

  // Show discovered servers
  const matched = untracked.filter((s) => s.registryId);
  const unmatched = untracked.filter((s) => !s.registryId);

  if (matched.length > 0) {
    p.log.step(`${matched.length} server(s) matched to registry:`);
    for (const s of matched) {
      p.log.info(
        `  ${s.name} -> ${s.registryName} (${s.registryId})\n    Apps: ${s.apps.join(", ")}`,
      );
    }
  }

  if (unmatched.length > 0) {
    p.log.step(`${unmatched.length} server(s) not in registry:`);
    for (const s of unmatched) {
      p.log.info(`  ${s.name}\n    Apps: ${s.apps.join(", ")}`);
    }
  }

  // Select which to adopt
  let toImport: DiscoveredServer[];

  if (isNonInteractive) {
    // In non-interactive mode, import all matched servers
    toImport = matched;
  } else if (matched.length > 0) {
    const selected = await p.multiselect({
      message: "Select servers to import into tracking:",
      options: matched.map((s) => ({
        label: `${s.registryName} (${s.registryId})`,
        hint: `from: ${s.apps.join(", ")}`,
        value: s,
      })),
      required: false,
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    toImport = selected;
  } else {
    toImport = [];
  }

  if (toImport.length === 0) {
    p.log.info("No servers selected for import.");
    p.outro("Done");
    return;
  }

  // Track selected servers (batch: read lock once, write once)
  const updatedLock = readLockFile();
  const now = new Date().toISOString();
  for (const s of toImport) {
    const serverId = s.registryId ?? s.name;
    const scopes: Record<string, "project" | "global"> = {};
    for (const appId of s.apps) {
      scopes[appId] = "project";
    }
    updatedLock.installations[serverId] = {
      apps: s.apps as import("@getmcp/core").AppIdType[],
      installedAt: now,
      updatedAt: now,
      envVars: [],
      ...(Object.keys(scopes).length > 0 ? { scopes } : {}),
    };
    p.log.success(`Imported: ${s.registryName ?? s.name} (${serverId})`);
  }
  writeLockFile(updatedLock);

  p.outro(`${toImport.length} server(s) imported.`);
}
