/**
 * @mcp-hub/registry
 *
 * Registry of popular MCP server definitions in canonical format.
 * Provides lookup, search, and listing functions.
 */

import type { RegistryEntryType } from "@mcp-hub/core";

// Server definitions
import { github } from "./servers/github.js";
import { filesystem } from "./servers/filesystem.js";
import { braveSearch } from "./servers/brave-search.js";
import { memory } from "./servers/memory.js";
import { slack } from "./servers/slack.js";
import { postgres } from "./servers/postgres.js";
import { puppeteer } from "./servers/puppeteer.js";
import { sequentialThinking } from "./servers/sequential-thinking.js";
import { sentry } from "./servers/sentry.js";
import { context7 } from "./servers/context7.js";
import { fetch } from "./servers/fetch.js";
import { googleMaps } from "./servers/google-maps.js";

// Re-export individual servers for direct access
export {
  github,
  filesystem,
  braveSearch,
  memory,
  slack,
  postgres,
  puppeteer,
  sequentialThinking,
  sentry,
  context7,
  fetch,
  googleMaps,
};

// ---------------------------------------------------------------------------
// Registry — all servers indexed by ID
// ---------------------------------------------------------------------------

const _registry: Map<string, RegistryEntryType> = new Map();

function register(entry: RegistryEntryType): void {
  _registry.set(entry.id, entry);
}

// Register all built-in servers
register(github);
register(filesystem);
register(braveSearch);
register(memory);
register(slack);
register(postgres);
register(puppeteer);
register(sequentialThinking);
register(sentry);
register(context7);
register(fetch);
register(googleMaps);

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
    (entry.categories ?? []).some((c) => c.toLowerCase() === cat),
  );
}

/**
 * Get all unique categories across all servers.
 */
export function getCategories(): string[] {
  const categories = new Set<string>();
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
