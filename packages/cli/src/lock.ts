/**
 * Installation tracking via lock file.
 *
 * Tracks which servers have been installed to which apps,
 * enabling check/update workflows.
 *
 * Lock file location: ./getmcp-lock.json (project root)
 *
 * Version history:
 *   v1: Keys were slugs (e.g. "github-github")
 *   v2: Keys are official reverse-DNS names (e.g. "io.github.modelcontextprotocol/servers-github")
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
  /** Per-app installation scope (missing entry = "project" for backwards compat) */
  scopes?: Partial<Record<string, "project" | "global">>;
  /** Registry source name this server was installed from */
  registry?: string;
}

export interface LockFile {
  version: 2;
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
  scopes: z.record(z.string(), z.enum(["project", "global"])).optional(),
  registry: z.string().optional(),
});

const LockFileV2Schema = z.object({
  version: z.literal(2),
  installations: z.record(z.string(), LockInstallationSchema),
});

const LockFileV1Schema = z.object({
  version: z.literal(1),
  installations: z.record(z.string(), LockInstallationSchema),
});

export const LockFileSchema = LockFileV2Schema;

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
// V1 → V2 migration
// ---------------------------------------------------------------------------

/**
 * Resolver function type for migrating v1 slug keys to v2 official name keys.
 * Given a slug, returns the official name if found, or undefined.
 */
export type SlugResolver = (slug: string) => string | undefined;

/**
 * Migrate a v1 lock file (slug-keyed) to v2 (official name-keyed).
 * If a resolver is provided, slugs are mapped to official names.
 * Unresolvable slugs are kept as-is (best effort).
 */
function migrateV1ToV2(
  v1: { version: 1; installations: Record<string, z.infer<typeof LockInstallationSchema>> },
  resolver?: SlugResolver,
): LockFile {
  const installations: Record<string, LockInstallation> = {};

  for (const [slug, installation] of Object.entries(v1.installations)) {
    const officialName = resolver?.(slug) ?? slug;
    // If multiple slugs resolve to the same official name, merge them
    const existing = installations[officialName];
    if (existing) {
      const allApps = new Set([...existing.apps, ...installation.apps]);
      existing.apps = [...allApps] as LockInstallation["apps"];
      const allEnv = new Set([...existing.envVars, ...installation.envVars]);
      existing.envVars = [...allEnv];
      if (installation.scopes) {
        existing.scopes = { ...existing.scopes, ...installation.scopes };
      }
    } else {
      installations[officialName] = { ...installation } as LockInstallation;
    }
  }

  return { version: 2, installations };
}

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/**
 * Read the lock file. Returns a default empty lock if it doesn't exist.
 * Automatically migrates v1 lock files to v2 format.
 */
export function readLockFile(filePath?: string, slugResolver?: SlugResolver): LockFile {
  const lockPath = filePath ?? getLockFilePath();

  if (!fs.existsSync(lockPath)) {
    return { version: 2, installations: {} };
  }

  try {
    const raw = fs.readFileSync(lockPath, "utf-8");
    if (!raw.trim()) return { version: 2, installations: {} };
    const parsed = JSON.parse(raw);

    // Try v2 first
    const v2Result = LockFileV2Schema.safeParse(parsed);
    if (v2Result.success) {
      return v2Result.data as LockFile;
    }

    // Try v1 and migrate
    const v1Result = LockFileV1Schema.safeParse(parsed);
    if (v1Result.success) {
      const migrated = migrateV1ToV2(v1Result.data, slugResolver);
      // Write back migrated version
      writeLockFile(migrated, filePath);
      return migrated;
    }

    return { version: 2, installations: {} };
  } catch {
    return { version: 2, installations: {} };
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

  const tmpPath = lockPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(lock, null, 2) + "\n", "utf-8");
  fs.renameSync(tmpPath, lockPath);
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/**
 * Record an installation of a server to one or more apps.
 *
 * @param scopes - Per-app scope map. Only apps with non-"project" scope need entries.
 */
export function trackInstallation(
  serverId: string,
  appIds: AppIdType[],
  envVarNames: string[],
  filePath?: string,
  scopes?: Partial<Record<string, "project" | "global">>,
  registry?: string,
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
    // Merge per-app scopes
    if (scopes) {
      existing.scopes = { ...existing.scopes, ...scopes };
    }
    // Update registry source if provided
    if (registry) {
      existing.registry = registry;
    }
  } else {
    lock.installations[serverId] = {
      apps: appIds,
      installedAt: now,
      updatedAt: now,
      envVars: envVarNames,
      ...(scopes && Object.keys(scopes).length > 0 ? { scopes } : {}),
      ...(registry ? { registry } : {}),
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

  // Clean up scopes for removed apps
  if (existing.scopes) {
    for (const appId of appIds) {
      delete existing.scopes[appId];
    }
    if (Object.keys(existing.scopes).length === 0) {
      delete existing.scopes;
    }
  }

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
