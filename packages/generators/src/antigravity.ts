/**
 * Google Antigravity IDE config generator.
 *
 * Config file: ~/.gemini/antigravity/mcp_config.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Antigravity uses the same canonical mcpServers format.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields, home } from "./base.js";

export class AntigravityGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "antigravity",
    name: "Antigravity",
    description: "Google's AI-first IDE",
    configPaths: {
      darwin: "~/.gemini/antigravity/mcp_config.json",
      win32: "%UserProfile%\\.gemini\\antigravity\\mcp_config.json",
      linux: "~/.gemini/antigravity/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://antigravity.google/docs/mcp",
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

  override detectInstalled(): boolean {
    return existsSync(join(home, ".gemini", "antigravity"));
  }
}
