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
export { transformToInternal, type InternalRegistryEntry } from "./transform.js";
export { generateSlug } from "./id-mapping.js";

// ---------------------------------------------------------------------------
// Registry state
// ---------------------------------------------------------------------------

const _registry: Map<string, InternalRegistryEntry> = new Map();
const _slugIndex: Map<string, string> = new Map(); // slug -> id
const _rawIndex: Map<string, RegistryEntryType> = new Map(); // server.name -> raw entry
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
    _rawIndex.set(raw.server.name, raw);
    const entry = transformToInternal(raw);
    if (entry) {
      _registry.set(entry.id, entry);
      _slugIndex.set(entry.slug, entry.id);
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
  _slugIndex.clear();
  _rawIndex.clear();
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
    _rawIndex.set(raw.server.name, raw);
    const entry = transformToInternal(raw);
    if (entry) {
      _registry.set(entry.id, entry);
      _slugIndex.set(entry.slug, entry.id);
    }
  }

  invalidateCache();
  _loaded = true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a server by its ID (official reverse-DNS name).
 */
export function getServer(id: string): InternalRegistryEntry | undefined {
  ensureLoaded();
  return _registry.get(id);
}

/**
 * Get a server by its ID, throwing if not found.
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
 * Get a server by its slug.
 */
export function getServerBySlug(slug: string): InternalRegistryEntry | undefined {
  ensureLoaded();
  const id = _slugIndex.get(slug);
  if (!id) return undefined;
  return _registry.get(id);
}

/**
 * Get a server by its official reverse-DNS name.
 * @deprecated Use getServer() directly — IDs are now official names.
 */
export function getServerByOfficialName(name: string): InternalRegistryEntry | undefined {
  return getServer(name);
}

/**
 * Get all registered server IDs (sorted).
 */
export function getServerIds(): string[] {
  ensureLoaded();
  if (!_sortedIdsCache) {
    _sortedIdsCache = Array.from(_registry.keys()).sort((a, b) => a.localeCompare(b));
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
      entry.slug,
      entry.name,
      entry.description,
      ...(entry.categories ?? []),
      entry.author ?? "",
      ...(entry.tags ?? []),
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
 * Load registry data from pre-built InternalRegistryEntry[].
 * Used by multi-registry cache to load merged entries without going through
 * the file-based transform pipeline.
 */
export function loadFromEntries(entries: InternalRegistryEntry[]): void {
  resetRegistry();

  for (const entry of entries) {
    _registry.set(entry.id, entry);
    _slugIndex.set(entry.slug, entry.id);
  }

  invalidateCache();
  _loaded = true;
}

/**
 * Get all servers from a specific registry source.
 */
export function getServersByRegistry(registryName: string): InternalRegistryEntry[] {
  return getAllServers().filter((entry) => entry.registrySource === registryName);
}

/**
 * Search servers within a specific registry source.
 */
export function searchServersInRegistry(
  query: string,
  registryName: string,
): InternalRegistryEntry[] {
  return searchServers(query).filter((entry) => entry.registrySource === registryName);
}

/**
 * Get all metrics as a Map keyed by server ID (official name).
 * Builds and caches the index on first call.
 */
export function getAllMetrics(): Map<string, GetMCPMetricsType> {
  ensureLoaded();
  if (!_metricsCache) {
    _metricsCache = new Map();
    for (const raw of _rawEntries) {
      const m = raw._meta?.["es.getmcp/metrics"] as GetMCPMetricsType | undefined;
      if (m) _metricsCache.set(raw.server.name, m);
    }
  }
  return _metricsCache;
}

/**
 * Get metrics for a server by ID (official name) or slug.
 * Uses the cached metrics index for O(1) lookup.
 */
export function getServerMetrics(id: string): GetMCPMetricsType | undefined {
  const metrics = getAllMetrics();
  const direct = metrics.get(id);
  if (direct) return direct;

  // Fallback: try resolving slug to official name
  const officialId = _slugIndex.get(id);
  if (officialId) return metrics.get(officialId);

  return undefined;
}

/**
 * Get the full raw entry in official format by ID (official name) or slug.
 */
export function getRawServerData(id: string): RegistryEntryType | undefined {
  ensureLoaded();

  // Direct match by official name — O(1) via _rawIndex
  const direct = _rawIndex.get(id);
  if (direct) return direct;

  // Fallback: resolve slug to official name
  const officialId = _slugIndex.get(id);
  if (officialId) return _rawIndex.get(officialId);

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
