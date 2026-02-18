/**
 * Base class for config generators.
 * Provides common functionality for all app-specific generators.
 */

import type {
  ConfigGenerator,
  AppMetadata,
  LooseServerConfigType,
} from "@getmcp/core";

export abstract class BaseGenerator implements ConfigGenerator {
  abstract app: AppMetadata;

  abstract generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown>;

  generateAll(
    servers: Record<string, LooseServerConfigType>,
  ): Record<string, unknown> {
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
    if (
      isPlainObject(targetVal) &&
      isPlainObject(sourceVal)
    ) {
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
  return result;
}
