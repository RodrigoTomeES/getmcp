/**
 * Registry cache — orchestration layer for multi-registry cache management.
 *
 * Coordinates per-registry cache initialization, refresh, and cleanup, then
 * merges all cached data into the registry engine.
 *
 * Cache layout:
 *   ~/.config/getmcp/registry-cache/
 *     official/
 *       servers.json          # raw RegistryEntryType[]
 *       cache-metadata.json   # { syncedAt, lastCheckedAt, lastUpdatedSince? }
 *     <registry-name>/
 *       servers.json
 *       cache-metadata.json
 *
 * Fallback chain: remote API → local cache → bundled npm data.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  loadFromEntries,
  generateSlug,
  transformToInternal,
  extractServerConfig,
  type InternalRegistryEntry,
} from "@getmcp/registry";
import type { RegistryEntryType } from "@getmcp/core";
import { getAllRegistries, type RegistrySourceType } from "./registry-config.js";

// Re-export I/O and fetch utilities for backwards compatibility
export { getRegistryCacheDir, getRegistryCacheSubdir } from "./registry-cache-io.js";
export { fetchFromRegistryAPI } from "./registry-cache-fetch.js";

import {
  getRegistryCacheSubdir,
  getRegistryCacheDir,
  readCacheMetadata,
  writeCacheMetadata,
  atomicWriteJson,
  readCachedServers,
} from "./registry-cache-io.js";
import { fetchFromRegistryAPI, mergeEntries } from "./registry-cache-fetch.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Check at most once per hour */
const CACHE_TTL_MS = 3_600_000;

// ---------------------------------------------------------------------------
// Per-registry cache management
// ---------------------------------------------------------------------------

interface SingleRegistryCacheResult {
  fetchSucceeded: boolean;
}

/**
 * Initialise the cache for a single registry.
 *
 * Flow:
 *   1. Check TTL — if cache is fresh, return without network.
 *   2. If cache exists — incremental fetch using `lastUpdatedSince`.
 *   3. Merge incremental updates into cached entries.
 *   4. If no cache — full fetch (all pages, all cursors).
 *   5. Write updated entries + metadata to disk.
 *
 * Returns { fetchSucceeded: true } when a network fetch completed successfully,
 * { fetchSucceeded: false } when falling back to cached data or on failure.
 * Never throws — errors are isolated per registry.
 */
async function initSingleRegistryCache(
  registry: RegistrySourceType,
  forceFetch = false,
): Promise<SingleRegistryCacheResult> {
  const subdir = getRegistryCacheSubdir(registry.name);
  const metaPath = path.join(subdir, "cache-metadata.json");
  const serversPath = path.join(subdir, "servers.json");

  const cacheMeta = readCacheMetadata(metaPath);
  const hasCachedServers = fs.existsSync(serversPath);

  // TTL check — use cached data if still fresh and not force-fetching
  if (!forceFetch && cacheMeta && hasCachedServers) {
    const elapsed = Date.now() - new Date(cacheMeta.lastCheckedAt).getTime();
    if (elapsed < CACHE_TTL_MS) {
      return { fetchSucceeded: false };
    }
  }

  const now = new Date().toISOString();

  try {
    let mergedEntries: RegistryEntryType[];

    if (cacheMeta?.lastUpdatedSince && hasCachedServers) {
      // Incremental fetch — only entries updated since last sync
      const updatedEntries = await fetchFromRegistryAPI(registry, cacheMeta.lastUpdatedSince);
      const existing = readCachedServers(serversPath);
      mergedEntries = mergeEntries(existing, updatedEntries);
    } else {
      // Full fetch — no cache or force refresh
      mergedEntries = await fetchFromRegistryAPI(registry);
    }

    atomicWriteJson(serversPath, mergedEntries);
    writeCacheMetadata(metaPath, {
      syncedAt: now,
      lastCheckedAt: now,
      lastUpdatedSince: now,
    });

    return { fetchSucceeded: true };
  } catch {
    // Network failure — fall back to whatever is cached (no-op on disk)
    return { fetchSucceeded: false };
  }
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

/**
 * Transform a raw registry entry that has no getmcp enrichment metadata.
 * Derives metadata from official-format fields only.
 *
 * Used for entries from non-official registries that haven't been enriched
 * by the getmcp data pipeline.
 */
function transformToInternalRaw(
  entry: RegistryEntryType,
  slug: string,
  registryName: string,
): InternalRegistryEntry | null {
  const extracted = extractServerConfig(entry);
  if (!extracted) return null;

  const server = entry.server;

  // Runtime — inferred from first package's registryType
  let runtime: string | undefined;
  if (server.packages && server.packages.length > 0) {
    const rt = server.packages[0].registryType;
    if (rt === "npm") runtime = "node";
    else if (rt === "pypi") runtime = "python";
    else if (rt === "oci") runtime = "docker";
  }

  // Categories from publisher-provided keywords
  const publisherMeta = entry._meta?.["io.modelcontextprotocol.registry/publisher-provided"] as
    | { keywords?: string[] }
    | undefined;
  const categories: string[] = publisherMeta?.keywords ?? [];

  // Author — from server title or reverse-DNS namespace
  let author: string | undefined;
  if (server.title) {
    author = server.title;
  } else {
    const parts = server.name.split("/");
    if (parts.length >= 2) {
      const namespace = parts[0];
      const segments = namespace.split(".");
      const org = segments[segments.length - 1];
      if (org && org !== "io" && org !== "com" && org !== "github") {
        author = org;
      }
    }
  }

  const name =
    server.title ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  let pkg: string | undefined;
  if (server.packages && server.packages.length > 0) {
    pkg = server.packages[0].identifier;
  }

  return {
    id: entry.server.name,
    slug,
    name,
    description: server.description,
    config: extracted.config,
    package: pkg,
    runtime,
    repository: server.repository?.url,
    homepage: server.websiteUrl,
    author,
    categories,
    requiredEnvVars: extracted.requiredEnvVars,
    envVarDetails: extracted.envVarDetails,
    icons: server.icons?.map((i) => ({ src: i.src, mimeType: i.mimeType })),
    isOfficial: false,
    registrySource: registryName,
  };
}

// ---------------------------------------------------------------------------
// Merge & load all registries into the engine
// ---------------------------------------------------------------------------

/**
 * Read cached server data for all registries, transform entries to the internal
 * format, and load the merged result into the registry engine.
 *
 * IDs are now official reverse-DNS names (globally unique by design),
 * so cross-registry ID collision resolution is no longer needed.
 * Slugs are still generated for display / web URL purposes.
 *
 * Priority rules (lower number = higher priority):
 *   - If the same server name exists in multiple registries, the highest-priority
 *     registry's version wins.
 */
async function mergeRegistryData(registries: RegistrySourceType[]): Promise<void> {
  // Sorted ascending by priority (lowest number = highest priority)
  const sorted = [...registries].sort((a, b) => a.priority - b.priority);

  // Transform entries to internal format
  // Use a Map keyed by server.name (ID) — first registry to claim wins
  const entryMap = new Map<string, InternalRegistryEntry>();

  for (const registry of sorted) {
    const serversPath = path.join(getRegistryCacheSubdir(registry.name), "servers.json");
    const entries = readCachedServers(serversPath);

    for (const entry of entries) {
      // Skip if a higher-priority registry already claimed this server
      if (entryMap.has(entry.server.name)) continue;

      const slug = generateSlug(entry.server.name);

      // Try enriched transform first (requires es.getmcp/enrichment metadata)
      const enriched = transformToInternal(entry);
      let internal: InternalRegistryEntry | null;

      if (enriched) {
        internal = { ...enriched, registrySource: registry.name };
      } else {
        internal = transformToInternalRaw(entry, slug, registry.name);
      }

      if (internal) {
        entryMap.set(internal.id, internal);
      }
    }
  }

  if (entryMap.size === 0) {
    // No cached data at all — let the bundled data serve as fallback
    return;
  }

  loadFromEntries(Array.from(entryMap.values()));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the registry cache. Called once at CLI startup.
 *
 * For each configured registry:
 *   1. Check TTL — skip network if cache is fresh.
 *   2. Incremental fetch if cache exists; full fetch otherwise.
 *   3. Merge all cached data and load into the registry engine.
 *
 * Per-registry failures are isolated — one failing registry does not
 * prevent the others from loading.
 */
export async function initRegistryCache(): Promise<void> {
  const registries = getAllRegistries();
  await Promise.allSettled(registries.map((registry) => initSingleRegistryCache(registry, false)));
  await mergeRegistryData(registries);
}

/**
 * Clear the registry cache for all configured registries.
 * Deletes cache subdirectories (servers.json, cache-metadata.json, etc.).
 */
export async function clearRegistryCache(): Promise<void> {
  const registries = getAllRegistries();
  await Promise.allSettled(
    registries.map(async (registry) => {
      const cacheDir = getRegistryCacheSubdir(registry.name);
      await fs.promises.rm(cacheDir, { recursive: true, force: true });
    }),
  );
}

/**
 * Force-refresh the registry cache for all registries, ignoring TTL.
 *
 * - `"incremental"` — bypasses TTL but uses `updated_since` if cache exists.
 * - `"full"` — clears cache first, then fetches everything from scratch.
 *
 * Returns true if at least one registry's fetch succeeded.
 */
export async function refreshRegistryCache(
  mode: "incremental" | "full" = "full",
): Promise<boolean> {
  const registries = getAllRegistries();

  if (mode === "full") {
    await clearRegistryCache();
  }

  const results = await Promise.all(
    registries.map((registry) => initSingleRegistryCache(registry, true)),
  );

  // Merge regardless of individual outcomes — use whatever was successfully fetched
  await mergeRegistryData(registries);

  return results.some((r) => r.fetchSucceeded);
}

/**
 * Initialise caches for project-level registries that aren't already in the
 * global config, then re-merge all registries into the registry engine.
 */
export async function initProjectRegistries(
  projectRegistries: RegistrySourceType[],
): Promise<void> {
  if (projectRegistries.length === 0) return;

  const globalRegistries = getAllRegistries();
  const globalNames = new Set(globalRegistries.map((r) => r.name));

  // Fetch only project registries not already covered by the global config
  const novelRegistries = projectRegistries.filter((r) => !globalNames.has(r.name));

  if (novelRegistries.length > 0) {
    await Promise.allSettled(novelRegistries.map((r) => initSingleRegistryCache(r)));
  }

  // Merge global + project registries (project overrides by name, except "official")
  const merged = new Map<string, RegistrySourceType>(globalRegistries.map((r) => [r.name, r]));
  for (const pr of projectRegistries) {
    if (pr.name !== "official") {
      merged.set(pr.name, pr);
    }
  }

  const allRegistries = Array.from(merged.values()).sort((a, b) => a.priority - b.priority);
  await mergeRegistryData(allRegistries);
}

/**
 * Remove cache directories for registries that are no longer configured.
 * Best-effort: errors during removal are silently ignored.
 */
export function cleanOrphanedCaches(): void {
  const cacheDir = getRegistryCacheDir();

  if (!fs.existsSync(cacheDir)) return;

  const configuredNames = new Set(getAllRegistries().map((r) => r.name));

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(cacheDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;
    if (configuredNames.has(dirent.name)) continue;

    try {
      fs.rmSync(path.join(cacheDir, dirent.name), { recursive: true, force: true });
    } catch {
      // Best-effort — ignore removal errors
    }
  }
}
