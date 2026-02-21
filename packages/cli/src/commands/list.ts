/**
 * `getmcp list` command.
 *
 * Lists all MCP servers from the registry, or lists servers
 * installed in detected AI apps.
 */

import * as p from "@clack/prompts";
import {
  getAllServers,
  searchServers,
  getCategories,
  getServersByCategory,
  getServerCount,
} from "@getmcp/registry";
import { detectInstalledApps } from "../detect.js";
import { listServersInConfig } from "../config-file.js";
import { shortenPath } from "../utils.js";

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
    p.log.warn(search ? `No servers matching "${search}".` : "No servers in registry.");
    return;
  }

  const title = search
    ? `Servers matching "${search}" (${servers.length}):`
    : `Available MCP servers (${getServerCount()}):`;

  p.intro(title);

  const lines: string[] = [];
  for (const server of servers) {
    const transport = "command" in server.config ? "stdio" : "remote";
    const envCount = server.requiredEnvVars.length;
    const envNote = envCount > 0 ? ` [${envCount} env var${envCount > 1 ? "s" : ""} required]` : "";
    const categories =
      server.categories && server.categories.length > 0 ? ` (${server.categories.join(", ")})` : "";

    lines.push(`${server.id} — ${server.name}`);
    lines.push(`  ${server.description}`);
    lines.push(`  ${transport}${envNote}${categories}`);
    lines.push("");
  }

  console.log(lines.join("\n"));
}

async function listByCategory(category: string): Promise<void> {
  const servers = getServersByCategory(category);

  if (servers.length === 0) {
    p.log.warn(`No servers in category "${category}".`);
    p.log.info(`Available categories: ${getCategories().join(", ")}`);
    return;
  }

  p.intro(`Servers in category "${category}" (${servers.length}):`);

  const lines: string[] = [];
  for (const server of servers) {
    lines.push(`${server.id} — ${server.name}`);
    lines.push(`  ${server.description}`);
    lines.push("");
  }

  console.log(lines.join("\n"));
}

async function listInstalledServers(): Promise<void> {
  const apps = detectInstalledApps();

  if (apps.length === 0) {
    p.log.warn("No AI applications detected on this system.");
    return;
  }

  p.intro(`Detected AI applications (${apps.length}):`);

  for (const app of apps) {
    let serversLine: string;

    try {
      const servers = listServersInConfig(app.configPath);
      serversLine = servers.length > 0 ? servers.join(", ") : "(none configured)";
    } catch {
      serversLine = "(config not readable)";
    }

    p.log.info(`${app.name}\n  Config: ${shortenPath(app.configPath)}\n  Servers: ${serversLine}`);
  }
}
