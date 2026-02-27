/**
 * `getmcp remove` command.
 *
 * Workflow:
 * 1. User provides server name to remove
 * 2. Detect installed apps
 * 3. User selects which apps to remove from (or all)
 * 4. Remove server from each selected config file
 *
 * Supports non-interactive mode via --yes flag.
 * Supports --dry-run to preview changes without writing.
 */

import * as p from "@clack/prompts";
import { detectInstalledApps, type DetectedApp } from "../detect.js";
import { removeServerFromConfig, writeConfigFile, listServersInConfig } from "../config-file.js";
import { trackRemoval } from "../lock.js";
import { shortenPath, isNonInteractive as isNonInteractiveCheck } from "../utils.js";
import { formatError } from "../errors.js";

export interface RemoveOptions {
  yes?: boolean;
  apps?: string[];
  dryRun?: boolean;
  json?: boolean;
  global?: boolean;
  project?: boolean;
}

export async function removeCommand(
  serverName?: string,
  options: RemoveOptions = {},
): Promise<void> {
  const isNonInteractive = isNonInteractiveCheck(options);

  p.intro("getmcp remove");

  const installed = detectInstalledApps();

  if (installed.length === 0) {
    p.log.warn("No AI applications detected on this system.");
    p.outro("Done");
    return;
  }

  // Build map of all configured servers across apps
  const serverAppMap = new Map<string, DetectedApp[]>();
  for (const app of installed) {
    try {
      const servers = listServersInConfig(app.configPath);
      for (const s of servers) {
        const existing = serverAppMap.get(s) ?? [];
        existing.push(app);
        serverAppMap.set(s, existing);
      }
    } catch {
      // Skip apps with unreadable config
    }
  }

  // If no server name provided, offer interactive picker
  if (!serverName) {
    if (isNonInteractive) {
      p.log.error(
        "Usage: getmcp remove <server-name>\n  Provide the name/key of the MCP server to remove.",
      );
      process.exit(1);
    }

    if (serverAppMap.size === 0) {
      p.log.warn("No MCP servers found in any app configuration.");
      p.outro("Done");
      return;
    }

    const selected = await p.select({
      message: "Select a server to remove:",
      options: Array.from(serverAppMap.entries()).map(([name, apps]) => ({
        label: name,
        hint: `in ${apps.map((a) => a.name).join(", ")}`,
        value: name,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    serverName = selected;
  }

  // Find which apps have this server configured
  const appsWithServer = serverAppMap.get(serverName) ?? [];

  if (appsWithServer.length === 0) {
    p.log.warn(`Server "${serverName}" was not found in any detected app config.`);
    p.outro("Done");
    return;
  }

  const appList = appsWithServer
    .map((app) => `  - ${app.name} (${shortenPath(app.configPath)})`)
    .join("\n");

  p.log.info(`Found "${serverName}" in ${appsWithServer.length} app(s):\n${appList}`);

  // Select apps to remove from
  let selectedApps: DetectedApp[];

  if (options.apps && options.apps.length > 0) {
    // --app flag: filter to specified apps
    selectedApps = appsWithServer.filter((a) => options.apps!.includes(a.id));
    if (selectedApps.length === 0) {
      p.log.warn("None of the specified apps have this server configured.");
      p.outro("Done");
      return;
    }
  } else if (isNonInteractive) {
    // Non-interactive: remove from all apps that have it
    selectedApps = appsWithServer;
  } else {
    const selected = await p.multiselect({
      message: "Select apps to remove from:",
      options: appsWithServer.map((app) => ({
        label: app.name,
        hint: shortenPath(app.configPath),
        value: app,
      })),
      initialValues: appsWithServer,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    selectedApps = selected;
  }

  if (selectedApps.length === 0) {
    p.log.warn("No apps selected.");
    p.outro("Cancelled");
    return;
  }

  // Confirm removal
  if (!isNonInteractive) {
    const confirmed = await p.confirm({
      message: `Remove "${serverName}" from ${selectedApps.length} app(s)?`,
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

  const results: { id: string; name: string; removed: boolean }[] = [];

  for (const app of selectedApps) {
    try {
      const updated = removeServerFromConfig(app.configPath, serverName);
      if (updated) {
        if (options.dryRun) {
          if (!options.json) {
            p.log.info(
              `${app.name}: would remove "${serverName}" from ${shortenPath(app.configPath)}`,
            );
          }
        } else {
          writeConfigFile(app.configPath, updated);
          if (!options.json) p.log.success(`${app.name}: removed`);
        }
        results.push({ id: app.id, name: app.name, removed: true });
      } else {
        if (!options.json) p.log.warn(`${app.name}: not found (skipped)`);
        results.push({ id: app.id, name: app.name, removed: false });
      }
    } catch (err) {
      if (!options.json) p.log.error(`${app.name}: ${formatError(err)}`);
      results.push({ id: app.id, name: app.name, removed: false });
    }
  }

  // Track removal (unless dry-run)
  const removedApps = results.filter((r) => r.removed);
  if (!options.dryRun && removedApps.length > 0) {
    trackRemoval(
      serverName,
      removedApps.map((a) => a.id as import("@getmcp/core").AppIdType),
    );
  }

  if (options.json) {
    console.log(
      JSON.stringify({ server: serverName, apps: results, dryRun: !!options.dryRun }, null, 2),
    );
    return;
  }

  const action = options.dryRun ? "would be removed" : "has been removed";
  p.outro(`"${serverName}" ${action}.`);
}
