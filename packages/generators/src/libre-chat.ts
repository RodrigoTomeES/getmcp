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

import type { AppMetadata } from "@getmcp/core";
import YAML from "yaml";
import { BaseGenerator } from "./base.js";

export class LibreChatGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "libre-chat",
    name: "LibreChat",
    description: "Open-source AI chat platform with multi-provider support",
    configPaths: "librechat.yaml",
    globalConfigPaths: null,
    configFormat: "yaml",
    docsUrl: "https://www.librechat.ai/docs/configuration/mcp_servers",
  };

  /**
   * Serialize to YAML format.
   */
  override serialize(config: Record<string, unknown>): string {
    return YAML.stringify(config, { indent: 2 });
  }
}
