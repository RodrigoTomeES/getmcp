/**
 * Registry cache — auto-fetches fresh registry data from GitHub.
 *
 * Fallback chain: remote → local cache → bundled npm data.
 *
 * Cache is stored in a platform-specific directory:
 *   - Windows: %AppData%/getmcp/registry-cache/
 *   - macOS/Linux: ~/.config/getmcp/registry-cache/
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { loadFromPath } from "@getmcp/registry";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REMOTE_BASE =
  "https://raw.githubusercontent.com/RodrigoTomeES/getmcp/refs/heads/main/packages/registry/data";

/** Check at most once per hour */
const CACHE_TTL_MS = 3_600_000;

/** 5 s timeout for the tiny sync-metadata.json */
const METADATA_TIMEOUT_MS = 5_000;

/** 30 s timeout for the larger servers.json */
const DOWNLOAD_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/**
 * Get the platform-specific registry cache directory.
 */
export function getRegistryCacheDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "getmcp", "registry-cache");
  }

  const configDir = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(configDir, "getmcp", "registry-cache");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheMetadata {
  syncedAt: string;
  lastCheckedAt: string;
}

interface SyncMetadata {
  syncedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readCacheMetadata(metaPath: string): CacheMetadata | null {
  try {
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as CacheMetadata;
  } catch {
    return null;
  }
}

function writeCacheMetadata(metaPath: string, data: CacheMetadata): void {
  const dir = path.dirname(metaPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = metaPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  fs.renameSync(tmpPath, metaPath);
}

function atomicWriteFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the registry cache. Called once at CLI startup.
 *
 * 1. If TTL has not expired → use cached file (no network).
 * 2. If TTL expired → fetch sync-metadata.json.
 * 3. If syncedAt unchanged → update lastCheckedAt, use cache.
 * 4. If syncedAt changed → download servers.json, cache it.
 * 5. If offline → fall back to cache → fall back to bundled data.
 */
export async function initRegistryCache(): Promise<void> {
  const cacheDir = getRegistryCacheDir();
  const metaPath = path.join(cacheDir, "cache-metadata.json");
  const serversPath = path.join(cacheDir, "servers.json");

  const cacheMeta = readCacheMetadata(metaPath);

  // If cache exists and TTL has not expired, use cached file directly
  if (cacheMeta) {
    const elapsed = Date.now() - new Date(cacheMeta.lastCheckedAt).getTime();
    if (elapsed < CACHE_TTL_MS) {
      if (fs.existsSync(serversPath)) {
        loadFromPath(serversPath);
      }
      return;
    }
  }

  // TTL expired or no cache — try to check remote
  try {
    const remoteMeta = await fetchJson<SyncMetadata>(
      `${REMOTE_BASE}/sync-metadata.json`,
      METADATA_TIMEOUT_MS,
    );

    const now = new Date().toISOString();

    // If syncedAt unchanged, just update the check timestamp
    if (cacheMeta && cacheMeta.syncedAt === remoteMeta.syncedAt && fs.existsSync(serversPath)) {
      writeCacheMetadata(metaPath, { syncedAt: cacheMeta.syncedAt, lastCheckedAt: now });
      loadFromPath(serversPath);
      return;
    }

    // syncedAt differs or no cache — download full servers.json
    const serversData = await fetchText(`${REMOTE_BASE}/servers.json`, DOWNLOAD_TIMEOUT_MS);
    atomicWriteFile(serversPath, serversData);
    writeCacheMetadata(metaPath, { syncedAt: remoteMeta.syncedAt, lastCheckedAt: now });
    loadFromPath(serversPath);
  } catch {
    // Offline or error — fall back to cache if it exists
    if (fs.existsSync(serversPath)) {
      loadFromPath(serversPath);
    }
    // Otherwise let the registry fall through to its bundled data
  }
}

/**
 * Force-refresh the registry cache, ignoring TTL.
 * Returns true if the refresh succeeded, false otherwise.
 */
export async function refreshRegistryCache(): Promise<boolean> {
  const cacheDir = getRegistryCacheDir();
  const metaPath = path.join(cacheDir, "cache-metadata.json");
  const serversPath = path.join(cacheDir, "servers.json");

  try {
    const remoteMeta = await fetchJson<SyncMetadata>(
      `${REMOTE_BASE}/sync-metadata.json`,
      METADATA_TIMEOUT_MS,
    );

    const serversData = await fetchText(`${REMOTE_BASE}/servers.json`, DOWNLOAD_TIMEOUT_MS);
    atomicWriteFile(serversPath, serversData);

    const now = new Date().toISOString();
    writeCacheMetadata(metaPath, { syncedAt: remoteMeta.syncedAt, lastCheckedAt: now });
    loadFromPath(serversPath);
    return true;
  } catch {
    // Fall back to existing cache
    if (fs.existsSync(serversPath)) {
      loadFromPath(serversPath);
    }
    return false;
  }
}
