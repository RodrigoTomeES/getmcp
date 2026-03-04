/**
 * CLI credential management for private MCP registries.
 *
 * Stores authentication credentials for named registries on disk, encrypted
 * at the filesystem level via 0o600 permissions on Unix systems.
 *
 * Resolution order (highest priority first):
 *   1. Environment variable: GETMCP_REGISTRY_<NAME>_TOKEN
 *   2. Stored credentials file: ~/.config/getmcp/credentials.json
 *
 * Storage format: Record<string, RegistryCredentialType> keyed by registry name.
 *
 * Platform-specific paths:
 *   - Windows: %AppData%/getmcp/credentials.json
 *   - macOS/Linux: ~/.config/getmcp/credentials.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { RegistryCredentialType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Get the platform-specific path for the credentials file.
 */
export function getCredentialStorePath(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "getmcp", "credentials.json");
  }

  // macOS and Linux: use XDG_CONFIG_HOME or ~/.config
  const configDir = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(configDir, "getmcp", "credentials.json");
}

// ---------------------------------------------------------------------------
// Internal validation helpers
// ---------------------------------------------------------------------------

const VALID_METHODS = new Set(["bearer", "basic", "header"]);

/** Valid HTTP header name pattern (RFC 7230) */
const VALID_HEADER_PATTERN = /^[A-Za-z][A-Za-z0-9-]*$/;

/** Headers that must never be set via custom auth to prevent injection */
const BLOCKED_HEADERS = new Set([
  "host",
  "content-length",
  "transfer-encoding",
  "cookie",
  "authorization",
]);

/**
 * Validate that a header name is safe for use as a custom auth header.
 * Rejects names that don't match the valid pattern or that could hijack
 * sensitive HTTP headers.
 */
export function isValidHeaderName(name: string): boolean {
  if (!VALID_HEADER_PATTERN.test(name)) return false;
  if (BLOCKED_HEADERS.has(name.toLowerCase())) return false;
  return true;
}

/**
 * Validate that a value looks like a RegistryCredential.
 * Uses structural checks rather than Zod to avoid runtime import issues.
 */
function isValidCredential(value: unknown): value is RegistryCredentialType {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj["method"] !== "string" || !VALID_METHODS.has(obj["method"])) {
    return false;
  }

  if (obj["token"] !== undefined && typeof obj["token"] !== "string") return false;
  if (obj["username"] !== undefined && typeof obj["username"] !== "string") return false;
  if (obj["headerName"] !== undefined) {
    if (typeof obj["headerName"] !== "string") return false;
    if (!isValidHeaderName(obj["headerName"])) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Internal read/write helpers
// ---------------------------------------------------------------------------

/**
 * Read the credential store from disk.
 * Returns an empty object if the file doesn't exist or is corrupt.
 */
function readCredentialStore(filePath: string): Record<string, RegistryCredentialType> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw);

    // Must be a plain object
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    // Validate each entry structurally; discard invalid entries
    const result: Record<string, RegistryCredentialType> = {};
    for (const [name, value] of Object.entries(parsed)) {
      if (isValidCredential(value)) {
        result[name] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * Atomically write the credential store to disk.
 * Uses a .tmp file + rename to avoid partial writes.
 * Sets 0o600 permissions on non-Windows systems after writing.
 */
function writeCredentialStore(
  filePath: string,
  store: Record<string, RegistryCredentialType>,
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp`;
  const content = JSON.stringify(store, null, 2) + "\n";

  fs.writeFileSync(tmpPath, content, "utf-8");

  // Set restrictive permissions before the rename so the window of exposure
  // is minimal (the .tmp file is already protected before it becomes the
  // canonical path on POSIX systems).
  if (process.platform !== "win32") {
    fs.chmodSync(tmpPath, 0o600);
  }

  fs.renameSync(tmpPath, filePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store (upsert) a credential for the given registry name.
 * Creates parent directories and the file if they don't exist.
 * Sets 0o600 permissions on Unix after writing.
 */
export function storeCredential(
  name: string,
  credential: RegistryCredentialType,
  filePath?: string,
): void {
  const storePath = filePath ?? getCredentialStorePath();
  const store = readCredentialStore(storePath);
  store[name] = credential;
  writeCredentialStore(storePath, store);
}

/**
 * Remove the credential for the given registry name.
 * Returns true if a credential was found and removed, false otherwise.
 */
export function removeCredential(name: string, filePath?: string): boolean {
  const storePath = filePath ?? getCredentialStorePath();
  const store = readCredentialStore(storePath);

  if (!(name in store)) {
    return false;
  }

  delete store[name];
  writeCredentialStore(storePath, store);
  return true;
}

/**
 * Convert a registry name to the corresponding environment variable name.
 *
 * @example
 * getEnvVarName("my-registry") // "GETMCP_REGISTRY_MY_REGISTRY_TOKEN"
 */
export function getEnvVarName(name: string): string {
  return `GETMCP_REGISTRY_${name.toUpperCase().replace(/-/g, "_")}_TOKEN`;
}

/**
 * Resolve a credential for the given registry name.
 *
 * Resolution order:
 *   1. Environment variable GETMCP_REGISTRY_<NAME>_TOKEN — returned as an
 *      implicit bearer credential (token only, no stored entry required).
 *   2. Stored credential in the credentials file.
 *
 * Returns null when no credential is found via either mechanism.
 */
export function resolveCredential(name: string, filePath?: string): RegistryCredentialType | null {
  // 1. Check environment variable
  const envVarName = getEnvVarName(name);
  const envToken = process.env[envVarName];
  if (envToken) {
    return { method: "bearer", token: envToken };
  }

  // 2. Check stored credentials
  const storePath = filePath ?? getCredentialStorePath();
  const store = readCredentialStore(storePath);
  return store[name] ?? null;
}

/**
 * Resolve a credential and return HTTP request headers suitable for use
 * with the named registry.
 *
 * - bearer:  { Authorization: "Bearer <token>" }
 * - basic:   { Authorization: "Basic <base64(username:token)>" }
 * - header:  { [headerName]: "<token>" }
 *
 * Returns an empty object when no credential is found or required fields
 * are missing.
 */
export function buildAuthHeaders(name: string, filePath?: string): Record<string, string> {
  const credential = resolveCredential(name, filePath);
  if (!credential) {
    return {};
  }

  switch (credential.method) {
    case "bearer": {
      if (!credential.token) return {};
      return { Authorization: `Bearer ${credential.token}` };
    }

    case "basic": {
      if (!credential.token) return {};
      const username = credential.username ?? "";
      const encoded = Buffer.from(`${username}:${credential.token}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }

    case "header": {
      if (!credential.headerName || !credential.token) return {};
      if (!isValidHeaderName(credential.headerName)) return {};
      return { [credential.headerName]: credential.token };
    }

    default: {
      // Exhaustiveness guard — TypeScript will warn if a new method is added
      // to RegistryAuthMethod without handling it here.
      const _exhaustive: never = credential.method;
      void _exhaustive;
      return {};
    }
  }
}
