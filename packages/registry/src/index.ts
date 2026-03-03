/**
 * @getmcp/registry
 *
 * Registry of MCP server definitions synced from the official MCP registry.
 * Loads from data/servers.json, transforms to internal format, and provides
 * lookup, search, and listing functions.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { RegistryEntryType } from "@getmcp/core";
import { transformToInternal, type InternalRegistryEntry } from "./transform.js";
import { extractServerConfig, type ExtractedConfig } from "./extract-config.js";
import type { GetMCPMetricsType } from "./enrichment-types.js";

// Re-export for consumers
export { extractServerConfig, type ExtractedConfig } from "./extract-config.js";
export { type InternalRegistryEntry } from "./transform.js";

// ---------------------------------------------------------------------------
// Registry state
// ---------------------------------------------------------------------------

const _registry: Map<string, InternalRegistryEntry> = new Map();
const _officialNameIndex: Map<string, string> = new Map(); // officialName -> slug
let _rawEntries: RegistryEntryType[] = [];
let _loaded = false;
let _sortedCache: InternalRegistryEntry[] | null = null;
let _sortedIdsCache: string[] | null = null;
let _metricsCache: Map<string, GetMCPMetricsType> | null = null;

function ensureLoaded(): void {
  if (!_loaded) {
    loadServers();
    _loaded = true;
  }
}

function invalidateCache(): void {
  _sortedCache = null;
  _sortedIdsCache = null;
  _metricsCache = null;
}

function loadServers(): void {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Resolve data directory for both dev (src/) and dist/ contexts
  let dataPath = path.resolve(__dirname, "..", "data", "servers.json");
  if (!fs.existsSync(dataPath)) {
    dataPath = path.resolve(__dirname, "data", "servers.json");
  }

  if (!fs.existsSync(dataPath)) {
    // No data file yet — registry is empty until first sync
    return;
  }

  _rawEntries = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as RegistryEntryType[];

  for (const raw of _rawEntries) {
    const entry = transformToInternal(raw);
    if (entry) {
      _registry.set(entry.id, entry);
      _officialNameIndex.set(entry.officialName, entry.id);
    }
  }

  invalidateCache();
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

/**
 * Reset all registry state to unloaded.
 * Next call to any public API will re-trigger `loadServers()` from the bundled data.
 */
export function resetRegistry(): void {
  _registry.clear();
  _officialNameIndex.clear();
  _rawEntries = [];
  _loaded = false;
  invalidateCache();
}

/**
 * Load registry data from an arbitrary `servers.json` path.
 * Resets all existing state first. If the file does not exist, the registry
 * stays empty (no fallback to bundled data).
 */
export function loadFromPath(serversJsonPath: string): void {
  resetRegistry();

  if (!fs.existsSync(serversJsonPath)) {
    _loaded = true; // mark loaded so ensureLoaded() won't fall back to bundled
    return;
  }

  _rawEntries = JSON.parse(fs.readFileSync(serversJsonPath, "utf-8")) as RegistryEntryType[];

  for (const raw of _rawEntries) {
    const entry = transformToInternal(raw);
    if (entry) {
      _registry.set(entry.id, entry);
      _officialNameIndex.set(entry.officialName, entry.id);
    }
  }

  invalidateCache();
  _loaded = true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a server by its slug ID.
 */
export function getServer(id: string): InternalRegistryEntry | undefined {
  ensureLoaded();
  return _registry.get(id);
}

/**
 * Get a server by its slug ID, throwing if not found.
 */
export function getServerOrThrow(id: string): InternalRegistryEntry {
  ensureLoaded();
  const entry = _registry.get(id);
  if (!entry) {
    throw new Error(
      `Server "${id}" not found in registry. Available: ${getServerIds().join(", ")}`,
    );
  }
  return entry;
}

/**
 * Get a server by its official reverse-DNS name.
 */
export function getServerByOfficialName(name: string): InternalRegistryEntry | undefined {
  ensureLoaded();
  const slug = _officialNameIndex.get(name);
  if (!slug) return undefined;
  return _registry.get(slug);
}

/**
 * Get all registered server IDs (sorted).
 */
export function getServerIds(): string[] {
  ensureLoaded();
  if (!_sortedIdsCache) {
    _sortedIdsCache = Array.from(_registry.keys()).sort();
  }
  return _sortedIdsCache;
}

/**
 * Get all registered server entries (sorted by ID).
 */
export function getAllServers(): InternalRegistryEntry[] {
  ensureLoaded();
  if (!_sortedCache) {
    _sortedCache = Array.from(_registry.values()).sort((a, b) => a.id.localeCompare(b.id));
  }
  return _sortedCache;
}

/**
 * Get all official (first-party) servers.
 */
export function getOfficialServers(): InternalRegistryEntry[] {
  return getAllServers().filter((entry) => entry.isOfficial === true);
}

/**
 * Search servers by text query.
 * Matches against id, name, description, categories, author, and tags.
 */
export function searchServers(query: string): InternalRegistryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllServers();

  return getAllServers().filter((entry) => {
    const searchable = [
      entry.id,
      entry.name,
      entry.description,
      ...(entry.categories ?? []),
      entry.author ?? "",
      ...(entry.tags ?? []),
      entry.officialName,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });
}

/**
 * Filter servers by category.
 */
export function getServersByCategory(category: string): InternalRegistryEntry[] {
  const cat = category.toLowerCase();
  return getAllServers().filter((entry) =>
    (entry.categories ?? []).some((c: string) => c.toLowerCase() === cat),
  );
}

/**
 * Get all unique categories across all servers (sorted).
 */
export function getCategories(): string[] {
  ensureLoaded();
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
  ensureLoaded();
  return _registry.size;
}

/**
 * Find a registry server by command+args or package name.
 * Used by the `import` command to match existing servers.
 */
export function findServerByCommand(
  command: string,
  args: string[],
): InternalRegistryEntry | undefined {
  const argsStr = args.join(" ");

  ensureLoaded();
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

/**
 * Get all metrics as a Map keyed by slug ID.
 * Builds and caches the index on first call.
 */
export function getAllMetrics(): Map<string, GetMCPMetricsType> {
  ensureLoaded();
  if (!_metricsCache) {
    _metricsCache = new Map();
    for (const raw of _rawEntries) {
      const enrichment = raw._meta?.["es.getmcp/enrichment"] as { slug?: string } | undefined;
      if (enrichment?.slug) {
        const m = raw._meta?.["es.getmcp/metrics"] as GetMCPMetricsType | undefined;
        if (m) _metricsCache.set(enrichment.slug, m);
      }
    }
  }
  return _metricsCache;
}

/**
 * Get metrics for a server by slug ID.
 * Uses the cached metrics index for O(1) lookup.
 */
export function getServerMetrics(id: string): GetMCPMetricsType | undefined {
  return getAllMetrics().get(id);
}

/**
 * Get the full raw entry in official format by slug ID.
 */
export function getRawServerData(id: string): RegistryEntryType | undefined {
  ensureLoaded();
  for (const raw of _rawEntries) {
    const enrichment = raw._meta?.["es.getmcp/enrichment"] as { slug?: string } | undefined;
    if (enrichment?.slug === id) {
      return raw;
    }
  }
  return undefined;
}

/**
 * Get servers sorted by a metric.
 */
export function getServersSortedBy(
  metric: "stars" | "downloads" | "recent",
  limit?: number,
): InternalRegistryEntry[] {
  ensureLoaded();

  const withMetrics = getAllServers().map((entry) => ({
    entry,
    metrics: getServerMetrics(entry.id),
  }));

  withMetrics.sort((a, b) => {
    switch (metric) {
      case "stars":
        return (b.metrics?.github?.stars ?? 0) - (a.metrics?.github?.stars ?? 0);
      case "downloads": {
        const aDownloads =
          (a.metrics?.npm?.weeklyDownloads ?? 0) + (a.metrics?.pypi?.weeklyDownloads ?? 0);
        const bDownloads =
          (b.metrics?.npm?.weeklyDownloads ?? 0) + (b.metrics?.pypi?.weeklyDownloads ?? 0);
        return bDownloads - aDownloads;
      }
      case "recent":
        return (b.metrics?.github?.lastPush ?? "").localeCompare(a.metrics?.github?.lastPush ?? "");
    }
  });

  const sorted = withMetrics.map((m) => m.entry);
  return limit ? sorted.slice(0, limit) : sorted;
}
