/**
 * Base class for config generators.
 * Provides common functionality for all app-specific generators.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type { ConfigGenerator, AppMetadata, LooseServerConfigType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Lazy node:fs — avoids static import that breaks client-side bundlers
// ---------------------------------------------------------------------------

let _existsSync: (p: string) => boolean = () => false;
try {
  // process.getBuiltinModule (Node.js 22.3+) loads built-in modules without
  // triggering bundler module resolution, making it safe for browser builds.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fs = (process as any).getBuiltinModule?.("node:fs") as
    | { existsSync: (p: string) => boolean }
    | undefined;
  if (fs) _existsSync = fs.existsSync;
} catch {
  // Not available in browser environments
}
export { _existsSync as safeExistsSync };

// ---------------------------------------------------------------------------
// Shared path constants for detectInstalled() implementations
// ---------------------------------------------------------------------------

export const home = homedir();
export const configHome = process.env.XDG_CONFIG_HOME?.trim() || join(home, ".config");
export const appData = process.env.APPDATA?.trim() || join(home, "AppData", "Roaming");
export const localAppData = process.env.LOCALAPPDATA?.trim() || join(home, "AppData", "Local");
export const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, ".claude");
export const codexHome = process.env.CODEX_HOME?.trim() || join(home, ".codex");

export abstract class BaseGenerator implements ConfigGenerator {
  abstract app: AppMetadata;

  abstract generate(serverName: string, config: LooseServerConfigType): Record<string, unknown>;

  generateAll(servers: Record<string, LooseServerConfigType>): Record<string, unknown> {
    // Default: merge all individual generates under the same root key.
    // Subclasses can override if their format differs.
    let merged: Record<string, unknown> = {};
    for (const [name, config] of Object.entries(servers)) {
      const single = this.generate(name, config);
      merged = deepMerge(merged, single);
    }
    return merged;
  }

  serialize(config: Record<string, unknown>): string {
    return JSON.stringify(config, null, 2);
  }

  detectInstalled(): boolean {
    return false;
  }
}

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];
    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Extract a clean stdio config from a LooseServerConfig.
 * Strips transport field and undefined values.
 */
export function toStdioFields(config: LooseServerConfigType): Record<string, unknown> {
  if (!("command" in config)) {
    throw new Error("Expected stdio config but got remote config");
  }
  const result: Record<string, unknown> = {
    command: config.command,
  };
  if (config.args && config.args.length > 0) result.args = config.args;
  if (config.env && Object.keys(config.env).length > 0) result.env = config.env;
  if (config.cwd) result.cwd = config.cwd;
  if (config.timeout) result.timeout = config.timeout;
  if (config.description) result.description = config.description;
  return result;
}

/**
 * Extract a clean remote config from a LooseServerConfig.
 * Strips undefined values.
 */
export function toRemoteFields(config: LooseServerConfigType): Record<string, unknown> {
  if (!("url" in config)) {
    throw new Error("Expected remote config but got stdio config");
  }
  const result: Record<string, unknown> = {
    url: config.url,
  };
  if (config.transport) result.transport = config.transport;
  if (config.headers && Object.keys(config.headers).length > 0) result.headers = config.headers;
  if (config.timeout) result.timeout = config.timeout;
  if (config.description) result.description = config.description;
  return result;
}
