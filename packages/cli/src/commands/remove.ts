/**
 * `mcp-hub remove` command.
 *
 * Workflow:
 * 1. User provides server name to remove
 * 2. Detect installed apps
 * 3. User selects which apps to remove from (or all)
 * 4. Remove server from each selected config file
 */

import { checkbox, confirm } from "@inquirer/prompts";
import { detectInstalledApps, type DetectedApp } from "../detect.js";
import {
  removeServerFromConfig,
  writeConfigFile,
  listServersInConfig,
} from "../config-file.js";

export async function removeCommand(serverName?: string): Promise<void> {
  if (!serverName) {
    console.error("Usage: mcp-hub remove <server-name>");
    console.error("  Provide the name/key of the MCP server to remove.");
    process.exit(1);
  }

  const installed = detectInstalledApps();

  if (installed.length === 0) {
    console.log("No AI applications detected on this system.");
    return;
  }

  // Find which apps have this server configured
  const appsWithServer: DetectedApp[] = [];
  for (const app of installed) {
    try {
      const servers = listServersInConfig(app.configPath);
      if (servers.includes(serverName)) {
        appsWithServer.push(app);
      }
    } catch {
      // Skip apps with unreadable config
    }
  }

  if (appsWithServer.length === 0) {
    console.log(
      `Server "${serverName}" was not found in any detected app config.`,
    );
    return;
  }

  console.log(
    `\nFound "${serverName}" in ${appsWithServer.length} app(s):\n`,
  );
  for (const app of appsWithServer) {
    console.log(`  - ${app.name} (${app.configPath})`);
  }
  console.log();

  // Confirm removal
  const selectedApps = await checkbox<DetectedApp>({
    message: "Select apps to remove from:",
    choices: appsWithServer.map((app) => ({
      name: app.name,
      value: app,
      checked: true,
    })),
  });

  if (selectedApps.length === 0) {
    console.log("No apps selected. Cancelled.");
    return;
  }

  const yes = await confirm({
    message: `Remove "${serverName}" from ${selectedApps.length} app(s)?`,
    default: true,
  });

  if (!yes) {
    console.log("Cancelled.");
    return;
  }

  for (const app of selectedApps) {
    try {
      const updated = removeServerFromConfig(app.configPath, serverName);
      if (updated) {
        writeConfigFile(app.configPath, updated);
        console.log(`  - ${app.name}: removed`);
      } else {
        console.log(`  - ${app.name}: not found (skipped)`);
      }
    } catch (err) {
      console.error(
        `  ! ${app.name}: Failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  console.log(`\nDone! "${serverName}" has been removed.`);
}
