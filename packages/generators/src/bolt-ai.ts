/**
 * Bolt AI config generator.
 *
 * Config file: ~/Library/Application Support/BoltAI/mcp_config.json (macOS only)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Bolt AI uses the same canonical mcpServers format.
 * macOS-only application.
 */

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields, home, safeExistsSync } from "./base.js";

export class BoltAIGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "bolt-ai",
    name: "BoltAI",
    description: "Native macOS AI chat client",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/Library/Application Support/BoltAI/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.boltai.com/docs/mcp/overview",
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

  override detectInstalled(): boolean {
    if (process.platform !== "darwin") return false;
    return safeExistsSync(join(home, "Library", "Application Support", "BoltAI"));
  }
}
