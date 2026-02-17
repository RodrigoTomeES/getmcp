/**
 * Config file reading, merging, and writing.
 *
 * Key principle: NEVER overwrite existing config files.
 * Always read the existing config, merge the new server in, and write back.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Read and parse a JSON config file.
 * Returns an empty object if the file doesn't exist.
 * Handles JSONC (strips comments) for VS Code/OpenCode compatibility.
 */
export function readConfigFile(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.trim()) return {};

  // Strip single-line and multi-line comments for JSONC support
  const stripped = raw
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  try {
    return JSON.parse(stripped);
  } catch {
    throw new Error(`Failed to parse config file: ${filePath}`);
  }
}

/**
 * Write a config object to a JSON file.
 * Creates parent directories if they don't exist.
 */
export function writeConfigFile(
  filePath: string,
  config: Record<string, unknown>,
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

/**
 * Merge a generated server config into an existing config file.
 *
 * The generated config has the shape:
 *   { rootKey: { serverName: { ...serverConfig } } }
 *
 * This function deep-merges the server into the existing file's root key,
 * preserving all other existing servers and config.
 */
export function mergeServerIntoConfig(
  filePath: string,
  generatedConfig: Record<string, unknown>,
): Record<string, unknown> {
  const existing = readConfigFile(filePath);

  // Deep merge: for each top-level key in generated config
  for (const [rootKey, value] of Object.entries(generatedConfig)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const existingSection =
        (existing[rootKey] as Record<string, unknown>) ?? {};
      existing[rootKey] = {
        ...existingSection,
        ...(value as Record<string, unknown>),
      };
    } else {
      existing[rootKey] = value;
    }
  }

  return existing;
}

/**
 * Remove a server from a config file.
 *
 * Looks through all object values at the top level for a key matching
 * the server name and removes it.
 *
 * Returns the updated config, or null if the server wasn't found.
 */
export function removeServerFromConfig(
  filePath: string,
  serverName: string,
): Record<string, unknown> | null {
  const existing = readConfigFile(filePath);
  let found = false;

  for (const [rootKey, value] of Object.entries(existing)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const section = value as Record<string, unknown>;
      if (serverName in section) {
        delete section[serverName];
        found = true;
      }
    }
  }

  return found ? existing : null;
}

/**
 * List all server names found in a config file.
 * Scans known root keys: mcpServers, servers, extensions, mcp, context_servers.
 */
export function listServersInConfig(
  filePath: string,
): string[] {
  const existing = readConfigFile(filePath);
  const rootKeys = ["mcpServers", "servers", "extensions", "mcp", "context_servers"];
  const servers: string[] = [];

  for (const rootKey of rootKeys) {
    const section = existing[rootKey];
    if (typeof section === "object" && section !== null && !Array.isArray(section)) {
      servers.push(...Object.keys(section as Record<string, unknown>));
    }
  }

  return servers;
}
