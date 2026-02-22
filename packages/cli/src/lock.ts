/**
 * Installation tracking via lock file.
 *
 * Tracks which servers have been installed to which apps,
 * enabling check/update workflows.
 *
 * Lock file location: ./getmcp-lock.json (project root)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type { AppIdType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LockInstallation {
  /** App IDs this server is installed in */
  apps: AppIdType[];
  /** ISO timestamp of installation */
  installedAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Env var names that were set (values NOT stored for security) */
  envVars: string[];
  /** Installation scope (missing = "project" for backwards compat) */
  scope?: "project" | "global";
}

export interface LockFile {
  version: 1;
  installations: Record<string, LockInstallation>;
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const LockInstallationSchema = z.object({
  apps: z.array(z.string()),
  installedAt: z.string(),
  updatedAt: z.string(),
  envVars: z.array(z.string()),
  scope: z.enum(["project", "global"]).optional(),
});

const LockFileSchema = z.object({
  version: z.literal(1),
  installations: z.record(LockInstallationSchema),
});

export { LockFileSchema };

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Get the path for the project-level lock file.
 */
export function getLockFilePath(): string {
  return path.resolve("getmcp-lock.json");
}

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/**
 * Read the lock file. Returns a default empty lock if it doesn't exist.
 */
export function readLockFile(filePath?: string): LockFile {
  const lockPath = filePath ?? getLockFilePath();

  if (!fs.existsSync(lockPath)) {
    return { version: 1, installations: {} };
  }

  try {
    const raw = fs.readFileSync(lockPath, "utf-8");
    if (!raw.trim()) return { version: 1, installations: {} };
    const parsed = JSON.parse(raw);

    const result = LockFileSchema.safeParse(parsed);
    if (!result.success) {
      return { version: 1, installations: {} };
    }

    return result.data as LockFile;
  } catch {
    return { version: 1, installations: {} };
  }
}

/**
 * Write the lock file. Creates parent directories if needed.
 */
export function writeLockFile(lock: LockFile, filePath?: string): void {
  const lockPath = filePath ?? getLockFilePath();

  const dir = path.dirname(lockPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/**
 * Record an installation of a server to one or more apps.
 */
export function trackInstallation(
  serverId: string,
  appIds: AppIdType[],
  envVarNames: string[],
  filePath?: string,
  scope?: "project" | "global",
): void {
  const lock = readLockFile(filePath);
  const now = new Date().toISOString();

  const existing = lock.installations[serverId];
  if (existing) {
    // Merge apps (deduplicate)
    const allApps = new Set([...existing.apps, ...appIds]);
    existing.apps = [...allApps];
    existing.updatedAt = now;
    // Merge env var names
    const allEnv = new Set([...existing.envVars, ...envVarNames]);
    existing.envVars = [...allEnv];
    if (scope) existing.scope = scope;
  } else {
    lock.installations[serverId] = {
      apps: appIds,
      installedAt: now,
      updatedAt: now,
      envVars: envVarNames,
      ...(scope ? { scope } : {}),
    };
  }

  writeLockFile(lock, filePath);
}

/**
 * Record the removal of a server from one or more apps.
 * Removes the entire entry if no apps remain.
 */
export function trackRemoval(serverId: string, appIds: AppIdType[], filePath?: string): void {
  const lock = readLockFile(filePath);
  const existing = lock.installations[serverId];

  if (!existing) return;

  const removeSet = new Set(appIds);
  existing.apps = existing.apps.filter((a) => !removeSet.has(a));
  existing.updatedAt = new Date().toISOString();

  if (existing.apps.length === 0) {
    delete lock.installations[serverId];
  }

  writeLockFile(lock, filePath);
}

/**
 * Get all tracked installations.
 */
export function getTrackedServers(filePath?: string): LockFile {
  return readLockFile(filePath);
}
