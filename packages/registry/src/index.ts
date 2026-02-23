/**
 * @getmcp/registry
 *
 * Registry of popular MCP server definitions in canonical format.
 * Provides lookup, search, and listing functions.
 *
 * Server definitions are stored as JSON files in the `servers/` directory
 * and loaded automatically at startup.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { RegistryEntry } from "@getmcp/core";
import type { RegistryEntryType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Registry — all servers indexed by ID, loaded from JSON files
// ---------------------------------------------------------------------------

const _registry: Map<string, RegistryEntryType> = new Map();

function loadServers(): void {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Resolve servers directory for both dev (src/) and dist/ contexts
  let serversDir = path.resolve(__dirname, "..", "servers");
  if (!fs.existsSync(serversDir)) {
    serversDir = path.resolve(__dirname, "servers");
  }

  const files = fs.readdirSync(serversDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(serversDir, file);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Strip $schema before validation (it's for IDE use only)
    const { $schema: _, ...data } = raw;

    const entry = RegistryEntry.parse(data);

    // Enforce filename === id
    const expectedFile = `${entry.id}.json`;
    if (file !== expectedFile) {
      throw new Error(
        `Filename mismatch: "${file}" contains id "${entry.id}" (expected "${expectedFile}")`,
      );
    }

    _registry.set(entry.id, entry);
  }
}

loadServers();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a server definition by its ID.
 * Returns undefined if not found.
 */
export function getServer(id: string): RegistryEntryType | undefined {
  return _registry.get(id);
}

/**
 * Get a server definition by its ID, throwing if not found.
 */
export function getServerOrThrow(id: string): RegistryEntryType {
  const entry = _registry.get(id);
  if (!entry) {
    throw new Error(
      `Server "${id}" not found in registry. Available: ${getServerIds().join(", ")}`,
    );
  }
  return entry;
}

/**
 * Get all registered server IDs.
 */
export function getServerIds(): string[] {
  return Array.from(_registry.keys()).sort();
}

/**
 * Get all registered server entries.
 */
export function getAllServers(): RegistryEntryType[] {
  return Array.from(_registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Search servers by a text query.
 * Matches against id, name, description, and categories.
 */
export function searchServers(query: string): RegistryEntryType[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllServers();

  return getAllServers().filter((entry) => {
    const searchable = [
      entry.id,
      entry.name,
      entry.description,
      ...(entry.categories ?? []),
      entry.author ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });
}

/**
 * Filter servers by category.
 */
export function getServersByCategory(category: string): RegistryEntryType[] {
  const cat = category.toLowerCase();
  return getAllServers().filter((entry) =>
    (entry.categories ?? []).some((c: string) => c.toLowerCase() === cat),
  );
}

/**
 * Get all unique categories across all servers.
 */
export function getCategories(): RegistryEntryType["categories"] {
  const categories = new Set<RegistryEntryType["categories"][number]>();
  for (const entry of _registry.values()) {
    for (const cat of entry.categories ?? []) {
      categories.add(cat);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Get the total number of registered servers.
 */
export function getServerCount(): number {
  return _registry.size;
}

/**
 * Find a registry server that matches a given command+args or package name.
 * Used by the `import` command to match existing configured servers
 * back to known registry entries.
 */
export function findServerByCommand(
  command: string,
  args: string[],
): RegistryEntryType | undefined {
  const argsStr = args.join(" ");

  for (const entry of _registry.values()) {
    const config = entry.config;
    if (!("command" in config)) continue;

    // Match by package name in args
    if (entry.package && argsStr.includes(entry.package)) {
      return entry;
    }

    // Match by command + args pattern
    if (config.command === command && config.args) {
      const entryArgsStr = config.args.join(" ");
      if (argsStr.includes(entryArgsStr) || entryArgsStr.includes(argsStr)) {
        return entry;
      }
    }
  }

  return undefined;
}
