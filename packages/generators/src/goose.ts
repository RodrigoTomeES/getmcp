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

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig, inferTransport } from "@getmcp/core";
import YAML from "yaml";
import { BaseGenerator, configHome, appData } from "./base.js";

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
    scope: "global",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let extensionConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      extensionConfig = {
        name: serverName,
        cmd: config.command,
        ...(config.args && config.args.length > 0 ? { args: config.args } : {}),
        enabled: true,
        ...(config.env && Object.keys(config.env).length > 0 ? { envs: config.env } : {}),
        type: "stdio",
        ...(config.timeout ? { timeout: Math.ceil(config.timeout / 1000) } : {}),
        ...(config.description ? { description: config.description } : {}),
      };
    } else if (isRemoteConfig(config)) {
      const transport = inferTransport(config);
      extensionConfig = {
        name: serverName,
        uri: config.url,
        enabled: true,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { headers: config.headers }
          : {}),
        type: transport,
        ...(config.timeout ? { timeout: Math.ceil(config.timeout / 1000) } : {}),
        ...(config.description ? { description: config.description } : {}),
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
   * Serialize to YAML format using the `yaml` library.
   */
  override serialize(config: Record<string, unknown>): string {
    return YAML.stringify(config, { indent: 2 });
  }

  override detectInstalled(): boolean {
    return existsSync(join(configHome, "goose")) || existsSync(join(appData, "goose"));
  }
}
