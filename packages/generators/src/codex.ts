/**
 * Codex (OpenAI) config generator.
 *
 * Config file: ~/.codex/config.toml (TOML!)
 * Format:
 *   [mcp_servers.server-name]
 *   command = "npx"
 *   args = ["-y", "@package/name"]
 *
 *   [mcp_servers.server-name.env]
 *   API_KEY = "value"
 *
 * Remote (Streamable HTTP):
 *   [mcp_servers.remote-server]
 *   url = "https://mcp.example.com/mcp"
 *
 *   [mcp_servers.remote-server.http_headers]
 *   Authorization = "Bearer token"
 *
 * Key differences from canonical:
 *   - TOML format (not JSON)
 *   - Root key: "mcp_servers" (not "mcpServers")
 *   - "headers" → "http_headers"
 *   - "timeout" → "startup_timeout_sec" (ms to seconds)
 *   - No explicit "transport" field (Codex auto-detects)
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator } from "./base.js";

export class CodexGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "codex",
    name: "Codex",
    description: "OpenAI's AI coding agent",
    configPaths: {
      darwin: "~/.codex/config.toml",
      win32: "%UserProfile%\\.codex\\config.toml",
      linux: "~/.codex/config.toml",
    },
    configFormat: "toml",
    docsUrl: "https://developers.openai.com/codex/mcp/",
  };

  generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = {
        command: config.command,
        ...(config.args && config.args.length > 0 ? { args: config.args } : {}),
        ...(config.env && Object.keys(config.env).length > 0
          ? { env: config.env }
          : {}),
        ...(config.cwd ? { cwd: config.cwd } : {}),
        ...(config.timeout
          ? { startup_timeout_sec: Math.ceil(config.timeout / 1000) }
          : {}),
      };
    } else if (isRemoteConfig(config)) {
      serverConfig = {
        url: config.url,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { http_headers: config.headers }
          : {}),
        ...(config.timeout
          ? { startup_timeout_sec: Math.ceil(config.timeout / 1000) }
          : {}),
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      mcp_servers: {
        [serverName]: serverConfig,
      },
    };
  }

  /**
   * Serialize to TOML format.
   * Uses a minimal TOML serializer to avoid heavy dependencies.
   */
  override serialize(config: Record<string, unknown>): string {
    return toToml(config);
  }
}

/**
 * Minimal TOML serializer for Codex config.
 * Handles the table/key-value structures we produce.
 *
 * Outputs TOML tables like:
 *   [mcp_servers.name]
 *   command = "npx"
 *   args = ["-y", "@package/name"]
 *
 *   [mcp_servers.name.env]
 *   KEY = "value"
 */
function toToml(value: unknown, prefix: string = ""): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "";
  }

  const obj = value as Record<string, unknown>;
  const lines: string[] = [];

  // Separate scalar/array keys from sub-table keys
  const scalarKeys: string[] = [];
  const tableKeys: string[] = [];

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (isTable(val)) {
      tableKeys.push(key);
    } else {
      scalarKeys.push(key);
    }
  }

  // If this level has scalar keys and a prefix, emit the table header
  if (prefix && scalarKeys.length > 0) {
    lines.push(`[${prefix}]`);
  }

  // Emit scalar/array key-value pairs
  for (const key of scalarKeys) {
    lines.push(`${key} = ${toTomlValue(obj[key])}`);
  }

  // Recurse into sub-tables
  for (const key of tableKeys) {
    if (lines.length > 0) {
      lines.push(""); // blank line before sub-table
    }
    const subPrefix = prefix ? `${prefix}.${key}` : key;
    lines.push(toToml(obj[key], subPrefix));
  }

  return lines.join("\n");
}

/**
 * Serialize a single TOML value (non-table).
 */
function toTomlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value); // always double-quoted in TOML
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => toTomlValue(item));
    return `[${items.join(", ")}]`;
  }

  // Inline table (shouldn't normally reach here — tables are handled by toToml)
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const pairs = Object.keys(obj).map(
      (key) => `${key} = ${toTomlValue(obj[key])}`,
    );
    return `{ ${pairs.join(", ")} }`;
  }

  return JSON.stringify(String(value));
}

/**
 * Check if a value should be rendered as a TOML table (not inline).
 */
function isTable(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
