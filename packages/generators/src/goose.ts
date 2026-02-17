/**
 * Goose config generator.
 *
 * Config file: ~/.config/goose/config.yaml (YAML!)
 * Format:
 *   extensions:
 *     name:
 *       name: Display Name
 *       cmd: npx
 *       args: [-y, @package/name]
 *       enabled: true
 *       envs: { "KEY": "value" }
 *       type: stdio
 *       timeout: 300
 *
 * Key differences from canonical:
 *   - YAML format (not JSON)
 *   - Root key: "extensions" (not "mcpServers")
 *   - "cmd" (not "command")
 *   - "envs" (not "env")
 *   - Extra fields: "enabled", "timeout" (in seconds), "name" (display name)
 */

import type { AppMetadata, LooseServerConfigType } from "@mcp-hub/core";
import { isStdioConfig, isRemoteConfig, inferTransport } from "@mcp-hub/core";
import { BaseGenerator } from "./base.js";

export class GooseGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "goose",
    name: "Goose",
    description: "Block's autonomous AI coding agent",
    configPaths: {
      darwin: "~/.config/goose/config.yaml",
      win32: "%AppData%\\goose\\config.yaml",
      linux: "~/.config/goose/config.yaml",
    },
    configFormat: "yaml",
    docsUrl: "https://block.github.io/goose/docs/getting-started/using-extensions",
  };

  generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown> {
    let extensionConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      extensionConfig = {
        name: serverName,
        cmd: config.command,
        ...(config.args && config.args.length > 0 ? { args: config.args } : {}),
        enabled: true,
        ...(config.env && Object.keys(config.env).length > 0
          ? { envs: config.env }
          : {}),
        type: "stdio",
        ...(config.timeout ? { timeout: Math.ceil(config.timeout / 1000) } : {}),
      };
    } else if (isRemoteConfig(config)) {
      const transport = inferTransport(config);
      extensionConfig = {
        name: serverName,
        uri: config.url,
        enabled: true,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { envs: config.headers }
          : {}),
        type: transport,
        ...(config.timeout ? { timeout: Math.ceil(config.timeout / 1000) } : {}),
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      extensions: {
        [serverName]: extensionConfig,
      },
    };
  }

  /**
   * Serialize to YAML format.
   * Uses a minimal YAML serializer to avoid heavy dependencies.
   */
  override serialize(config: Record<string, unknown>): string {
    return toYaml(config, 0);
  }
}

/**
 * Minimal YAML serializer for Goose config.
 * Handles the simple object/array/scalar structures we produce.
 */
function toYaml(value: unknown, indent: number): string {
  const pad = "  ".repeat(indent);

  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    // Quote strings that could be ambiguous
    if (
      value === "" ||
      value === "true" ||
      value === "false" ||
      value === "null" ||
      /^[\d]/.test(value) ||
      /[:{}\[\],&*?|>!%#@`]/.test(value) ||
      value.includes("\n")
    ) {
      return JSON.stringify(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => `${pad}- ${toYaml(item, indent + 1).trimStart()}`)
      .join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";

    return keys
      .map((key) => {
        const val = obj[key];
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
        }
        if (Array.isArray(val)) {
          return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
        }
        return `${pad}${key}: ${toYaml(val, indent)}`;
      })
      .join("\n");
  }

  return String(value);
}
