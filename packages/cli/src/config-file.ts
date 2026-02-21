/**
 * Config file reading, merging, and writing.
 *
 * Supports JSON, JSONC, YAML, and TOML formats.
 * Format is auto-detected from the file extension.
 *
 * Key principle: NEVER overwrite existing config files.
 * Always read the existing config, merge the new server in, and write back.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";
import * as TOML from "smol-toml";

import { detectConfigFormat, type ConfigFormat } from "./format.js";
import { ConfigParseError } from "./errors.js";

/**
 * Strip JSONC comments (single-line `//` and multi-line `/* ... *​/`)
 * while respecting JSON string boundaries.
 *
 * Unlike a naive regex replace, this properly handles `//` sequences
 * inside JSON string values (e.g., URLs like "https://example.com").
 */
export function stripJsoncComments(raw: string): string {
  let result = "";
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const ch = raw[i];

    // Handle JSON strings — skip through them without stripping
    if (ch === '"') {
      result += ch;
      i++;
      // Walk through the string until the closing unescaped quote
      while (i < len) {
        const sch = raw[i];
        result += sch;
        if (sch === "\\") {
          // Escaped character — copy next char and skip
          i++;
          if (i < len) {
            result += raw[i];
            i++;
          }
        } else if (sch === '"') {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    // Handle single-line comment: //
    if (ch === "/" && i + 1 < len && raw[i + 1] === "/") {
      // Skip until end of line
      i += 2;
      while (i < len && raw[i] !== "\n") {
        i++;
      }
      continue;
    }

    // Handle multi-line comment: /* ... */
    if (ch === "/" && i + 1 < len && raw[i + 1] === "*") {
      i += 2;
      while (i < len) {
        if (raw[i] === "*" && i + 1 < len && raw[i + 1] === "/") {
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    // Regular character
    result += ch;
    i++;
  }

  return result;
}

/**
 * Parse raw file content according to the detected format.
 */
function parseContent(
  raw: string,
  format: ConfigFormat,
  filePath: string,
): Record<string, unknown> {
  try {
    switch (format) {
      case "json":
        return JSON.parse(raw);
      case "jsonc":
        return JSON.parse(stripJsoncComments(raw));
      case "yaml":
        return (YAML.parse(raw) as Record<string, unknown>) ?? {};
      case "toml":
        return TOML.parse(raw) as Record<string, unknown>;
      default:
        return JSON.parse(raw);
    }
  } catch (err) {
    throw new ConfigParseError(filePath, err instanceof Error ? err.message : undefined);
  }
}

/**
 * Serialize a config object to a string in the given format.
 */
function serializeContent(config: Record<string, unknown>, format: ConfigFormat): string {
  switch (format) {
    case "json":
    case "jsonc":
      return JSON.stringify(config, null, 2) + "\n";
    case "yaml":
      return YAML.stringify(config, { indent: 2 });
    case "toml":
      return TOML.stringify(config as TOML.TomlPrimitive) + "\n";
    default:
      return JSON.stringify(config, null, 2) + "\n";
  }
}

/**
 * Read and parse a config file.
 * Returns an empty object if the file doesn't exist or is empty.
 * Format is auto-detected from the file extension.
 */
export function readConfigFile(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.trim()) return {};

  const format = detectConfigFormat(filePath);
  return parseContent(raw, format, filePath);
}

/**
 * Write a config object to a file.
 * Creates parent directories if they don't exist.
 * Format is auto-detected from the file extension.
 */
export function writeConfigFile(filePath: string, config: Record<string, unknown>): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const format = detectConfigFormat(filePath);
  const content = serializeContent(config, format);
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Merge a generated server config into an existing config file.
 *
 * The generated config has the shape:
 *   { rootKey: { serverName: { ...serverConfig } } }
 *
 * This function deep-merges the server into the existing file's root key,
 * preserving all other existing servers and config.
 *
 * Format is auto-detected from the file extension at read/write boundaries.
 * The merge logic itself is format-agnostic (operates on plain objects).
 */
export function mergeServerIntoConfig(
  filePath: string,
  generatedConfig: Record<string, unknown>,
): Record<string, unknown> {
  const existing = readConfigFile(filePath);

  // Deep merge: for each top-level key in generated config
  for (const [rootKey, value] of Object.entries(generatedConfig)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const existingSection = (existing[rootKey] as Record<string, unknown>) ?? {};
      existing[rootKey] = {
        ...existingSection,
        ...(value as Record<string, unknown>),
      };
    } else {
      existing[rootKey] = value;
    }
  }

  return existing;
}

/**
 * Remove a server from a config file.
 *
 * Looks through all object values at the top level for a key matching
 * the server name and removes it.
 *
 * Returns the updated config, or null if the server wasn't found.
 * Format is auto-detected from the file extension.
 */
export function removeServerFromConfig(
  filePath: string,
  serverName: string,
): Record<string, unknown> | null {
  const existing = readConfigFile(filePath);
  let found = false;

  for (const [, value] of Object.entries(existing)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const section = value as Record<string, unknown>;
      if (serverName in section) {
        delete section[serverName];
        found = true;
      }
    }
  }

  return found ? existing : null;
}

/**
 * List all server names found in a config file.
 * Scans known root keys: mcpServers, servers, extensions, mcp,
 * context_servers, mcp_servers.
 * Format is auto-detected from the file extension.
 */
export function listServersInConfig(filePath: string): string[] {
  const existing = readConfigFile(filePath);
  const rootKeys = ["mcpServers", "servers", "extensions", "mcp", "context_servers", "mcp_servers"];
  const servers: string[] = [];

  for (const rootKey of rootKeys) {
    const section = existing[rootKey];
    if (typeof section === "object" && section !== null && !Array.isArray(section)) {
      servers.push(...Object.keys(section as Record<string, unknown>));
    }
  }

  return servers;
}
