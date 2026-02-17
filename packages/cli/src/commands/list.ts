/**
 * `mcp-hub list` command.
 *
 * Lists all MCP servers from the registry, or lists servers
 * installed in detected AI apps.
 */

import {
  getAllServers,
  searchServers,
  getCategories,
  getServersByCategory,
  getServerCount,
} from "@mcp-hub/registry";
import { detectInstalledApps } from "../detect.js";
import { listServersInConfig } from "../config-file.js";

export async function listCommand(options: {
  installed?: boolean;
  search?: string;
  category?: string;
}): Promise<void> {
  if (options.installed) {
    return listInstalledServers();
  }

  if (options.category) {
    return listByCategory(options.category);
  }

  return listRegistry(options.search);
}

async function listRegistry(search?: string): Promise<void> {
  const servers = search ? searchServers(search) : getAllServers();

  if (servers.length === 0) {
    console.log(search ? `No servers matching "${search}".` : "No servers in registry.");
    return;
  }

  const title = search
    ? `Servers matching "${search}" (${servers.length}):`
    : `Available MCP servers (${getServerCount()}):`;

  console.log(`\n${title}\n`);

  for (const server of servers) {
    const transport = "command" in server.config ? "stdio" : "remote";
    const envCount = server.requiredEnvVars.length;
    const envNote = envCount > 0 ? ` [${envCount} env var${envCount > 1 ? "s" : ""} required]` : "";
    console.log(`  ${server.id}`);
    console.log(`    ${server.name} — ${server.description}`);
    console.log(`    Transport: ${transport}${envNote}`);
    if (server.categories && server.categories.length > 0) {
      console.log(`    Categories: ${server.categories.join(", ")}`);
    }
    console.log();
  }
}

async function listByCategory(category: string): Promise<void> {
  const servers = getServersByCategory(category);

  if (servers.length === 0) {
    console.log(`No servers in category "${category}".`);
    console.log(`\nAvailable categories: ${getCategories().join(", ")}`);
    return;
  }

  console.log(`\nServers in category "${category}" (${servers.length}):\n`);
  for (const server of servers) {
    console.log(`  ${server.id} — ${server.name}`);
    console.log(`    ${server.description}`);
    console.log();
  }
}

async function listInstalledServers(): Promise<void> {
  const apps = detectInstalledApps();

  if (apps.length === 0) {
    console.log("No AI applications detected on this system.");
    return;
  }

  console.log(`\nDetected AI applications (${apps.length}):\n`);

  for (const app of apps) {
    console.log(`  ${app.name}`);
    console.log(`    Config: ${app.configPath}`);

    try {
      const servers = listServersInConfig(app.configPath);
      if (servers.length > 0) {
        console.log(`    Servers: ${servers.join(", ")}`);
      } else {
        console.log(`    Servers: (none configured)`);
      }
    } catch {
      console.log(`    Servers: (config not readable)`);
    }
    console.log();
  }
}
