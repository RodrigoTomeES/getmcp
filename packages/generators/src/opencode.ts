/**
 * OpenCode config generator.
 *
 * Config file: opencode.json / opencode.jsonc
 * Format:
 *   {
 *     "$schema": "https://opencode.ai/config.json",
 *     "mcp": {
 *       "name": {
 *         "type": "local",
 *         "command": ["npx", "-y", "package"],
 *         "environment": { "KEY": "value" },
 *         "enabled": true,
 *         "timeout": 5000
 *       }
 *     }
 *   }
 *
 * Key differences from canonical:
 *   - Root key: "mcp" (not "mcpServers")
 *   - "command" is an ARRAY that merges command + args
 *   - "environment" (not "env")
 *   - Requires explicit "type": "local" | "remote"
 *   - Has "enabled" field
 *   - Env var syntax: {env:VAR} (no $ prefix)
 */

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, configHome, safeExistsSync } from "./base.js";

export class OpenCodeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "opencode",
    name: "OpenCode",
    description: "Open-source AI coding agent by Anomaly",
    configPaths: "opencode.json",
    globalConfigPaths: null,
    configFormat: "jsonc",
    docsUrl: "https://opencode.ai/docs/mcp-servers/",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      // OpenCode merges command + args into a single "command" array
      const commandArray: string[] = [config.command];
      if (config.args && config.args.length > 0) {
        commandArray.push(...config.args);
      }

      serverConfig = {
        type: "local",
        command: commandArray,
        enabled: true,
        ...(config.env && Object.keys(config.env).length > 0 ? { environment: config.env } : {}),
        ...(config.timeout ? { timeout: config.timeout } : {}),
        ...(config.description ? { description: config.description } : {}),
      };
    } else if (isRemoteConfig(config)) {
      serverConfig = {
        type: "remote",
        url: config.url,
        enabled: true,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { headers: config.headers }
          : {}),
        ...(config.timeout ? { timeout: config.timeout } : {}),
        ...(config.description ? { description: config.description } : {}),
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      mcp: {
        [serverName]: serverConfig,
      },
    };
  }

  override generateAll(servers: Record<string, LooseServerConfigType>): Record<string, unknown> {
    const mcp: Record<string, unknown> = {};
    for (const [name, config] of Object.entries(servers)) {
      const single = this.generate(name, config);
      const mcpSection = single.mcp as Record<string, unknown>;
      Object.assign(mcp, mcpSection);
    }
    return {
      $schema: "https://opencode.ai/config.json",
      mcp,
    };
  }

  override detectInstalled(): boolean {
    return safeExistsSync(join(configHome, "opencode"));
  }
}
