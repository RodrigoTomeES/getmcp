/**
 * Registry cache I/O — file operations for the registry cache layer.
 *
 * Handles reading/writing cache metadata and server entries, atomic file
 * operations, and cache directory path resolution.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { RegistryEntryType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheMetadata {
  /** ISO timestamp of last successful full/incremental sync */
  syncedAt: string;
  /** ISO timestamp of last TTL check */
  lastCheckedAt: string;
  /** Timestamp used as `updated_since` for the next incremental fetch */
  lastUpdatedSince?: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/**
 * Get the platform-specific registry cache directory (root).
 */
export function getRegistryCacheDir(): string {
  // Respect XDG_CONFIG_HOME on all platforms (including Windows) — this is
  // the standard override mechanism and also used by tests to isolate cache.
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, "getmcp", "registry-cache");
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "getmcp", "registry-cache");
  }

  return path.join(os.homedir(), ".config", "getmcp", "registry-cache");
}

/** Valid registry name pattern — must match the schema in registry-config.ts */
const VALID_REGISTRY_NAME = /^[a-z0-9-]+$/;

/**
 * Get the cache subdirectory for a specific registry.
 * Validates the registry name to prevent path traversal.
 */
export function getRegistryCacheSubdir(registryName: string): string {
  if (!VALID_REGISTRY_NAME.test(registryName)) {
    throw new Error(`Invalid registry name for cache path: "${registryName}"`);
  }
  const cacheDir = getRegistryCacheDir();
  const resolved = path.resolve(cacheDir, registryName);
  // Ensure the resolved path is under the expected cache directory
  if (!resolved.startsWith(cacheDir + path.sep) && resolved !== cacheDir) {
    throw new Error(`Registry name resolves outside cache directory: "${registryName}"`);
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

export function readCacheMetadata(metaPath: string): CacheMetadata | null {
  try {
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as CacheMetadata;
  } catch {
    return null;
  }
}

export function writeCacheMetadata(metaPath: string, data: CacheMetadata): void {
  const dir = path.dirname(metaPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = metaPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  fs.renameSync(tmpPath, metaPath);
}

export function atomicWriteJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export function readCachedServers(serversPath: string): RegistryEntryType[] {
  try {
    if (!fs.existsSync(serversPath)) return [];
    return JSON.parse(fs.readFileSync(serversPath, "utf-8")) as RegistryEntryType[];
  } catch {
    return [];
  }
}
