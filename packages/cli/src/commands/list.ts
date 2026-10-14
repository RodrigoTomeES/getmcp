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
import { detectInstalledApps, getReadableConfigPaths, type DetectedApp } from "../detect.js";
import { listServersInConfig } from "../config-file.js";
import { shortenPath } from "../utils.js";

export async function listCommand(options: {
  installed?: boolean;
  search?: string;
  category?: string;
  json?: boolean;
  quiet?: boolean;
}): Promise<void> {
  if (options.installed) {
    return listInstalledServers(options);
  }

  if (options.category) {
    return listByCategory(options.category, options);
  }

  return listRegistry(options.search, options);
}

interface OutputOptions {
  json?: boolean;
  quiet?: boolean;
}

async function listRegistry(search?: string, opts: OutputOptions = {}): Promise<void> {
  const servers = search ? searchServers(search) : getAllServers();

  if (opts.json) {
    const data = servers.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      transport: "command" in s.config ? "stdio" : "remote",
      categories: s.categories ?? [],
      requiredEnvVars: s.requiredEnvVars,
      ...(s.registrySource ? { registry: s.registrySource } : {}),
    }));
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (opts.quiet) {
    for (const server of servers) {
      console.log(server.id);
    }
    return;
  }

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
    const registryTag =
      server.registrySource && server.registrySource !== "official"
        ? ` [${server.registrySource}]`
        : "";

    lines.push(`${server.id} — ${server.name}${registryTag}`);
    lines.push(`  ${server.description}`);
    lines.push(`  ${transport}${envNote}${categories}`);
    lines.push("");
  }

  console.log(lines.join("\n"));
}

async function listByCategory(category: string, opts: OutputOptions = {}): Promise<void> {
  const servers = getServersByCategory(category);

  if (opts.json) {
    const data = servers.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      transport: "command" in s.config ? "stdio" : "remote",
      categories: s.categories ?? [],
      requiredEnvVars: s.requiredEnvVars,
    }));
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (opts.quiet) {
    for (const server of servers) {
      console.log(server.id);
    }
    return;
  }

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

/**
 * Read every config an app actually has (project and/or global).
 * `unreadable` is true when at least one existing config failed to parse.
 */
function readAppConfigs(app: DetectedApp): {
  configs: { scope: "project" | "global"; path: string; servers: string[] }[];
  servers: string[];
  unreadable: boolean;
} {
  const configs: { scope: "project" | "global"; path: string; servers: string[] }[] = [];
  const servers = new Set<string>();
  let unreadable = false;

  for (const { scope, path } of getReadableConfigPaths(app)) {
    try {
      const found = listServersInConfig(path);
      configs.push({ scope, path, servers: found });
      for (const server of found) servers.add(server);
    } catch {
      unreadable = true;
    }
  }

  return { configs, servers: [...servers], unreadable };
}

async function listInstalledServers(opts: OutputOptions = {}): Promise<void> {
  const apps = detectInstalledApps();

  if (opts.json) {
    const data = apps.map((app) => {
      const { configs, servers } = readAppConfigs(app);
      return {
        id: app.id,
        name: app.name,
        // Kept for backwards compatibility; `configs` is authoritative
        configPath: app.configPath,
        servers,
        configs,
      };
    });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (opts.quiet) {
    for (const app of apps) {
      for (const server of readAppConfigs(app).servers) {
        console.log(`${app.id}:${server}`);
      }
    }
    return;
  }

  if (apps.length === 0) {
    p.log.warn("No AI applications detected on this system.");
    return;
  }

  p.intro(`Detected AI applications (${apps.length}):`);

  for (const app of apps) {
    const { configs, servers, unreadable } = readAppConfigs(app);

    const serversLine =
      servers.length > 0
        ? servers.join(", ")
        : unreadable
          ? "(config not readable)"
          : "(none configured)";

    // Label scope only when the app has configs in both scopes
    const configLine =
      configs.length > 0
        ? configs
            .map((c) =>
              configs.length > 1 ? `${shortenPath(c.path)} (${c.scope})` : shortenPath(c.path),
            )
            .join(", ")
        : shortenPath(app.configPath);

    p.log.info(`${app.name}\n  Config: ${configLine}\n  Servers: ${serversLine}`);
  }
}
