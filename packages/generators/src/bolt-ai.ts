/**
 * Bolt AI config generator.
 *
 * Config file: ~/Library/Application Support/BoltAI/mcp_config.json (macOS only)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Bolt AI uses the same canonical mcpServers format.
 * macOS-only application.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class BoltAIGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "bolt-ai",
    name: "BoltAI",
    description: "Native macOS AI chat client",
    configPaths: {
      darwin: "~/Library/Application Support/BoltAI/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.boltai.com/docs/mcp/overview",
    scope: "global",
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
}
