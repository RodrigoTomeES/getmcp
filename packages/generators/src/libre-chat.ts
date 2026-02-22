/**
 * LibreChat config generator.
 *
 * Config file: librechat.yaml
 * Format (YAML):
 *   mcpServers:
 *     name:
 *       command: npx
 *       args: [-y, @package/name]
 *       env:
 *         KEY: value
 *
 * Key differences from canonical:
 *   - YAML format (not JSON)
 *   - Otherwise uses the same mcpServers root key and field names
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import YAML from "yaml";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class LibreChatGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "libre-chat",
    name: "LibreChat",
    description: "Open-source AI chat platform with multi-provider support",
    configPaths: {
      darwin: "librechat.yaml",
      win32: "librechat.yaml",
      linux: "librechat.yaml",
    },
    configFormat: "yaml",
    docsUrl: "https://www.librechat.ai/docs/configuration/mcp_servers",
    scope: "project",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = toStdioFields(config);
    } else if (isRemoteConfig(config)) {
      serverConfig = toRemoteFields(config);
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      mcpServers: {
        [serverName]: serverConfig,
      },
    };
  }

  /**
   * Serialize to YAML format.
   */
  override serialize(config: Record<string, unknown>): string {
    return YAML.stringify(config, { indent: 2 });
  }
}
