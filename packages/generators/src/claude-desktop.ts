/**
 * Claude Desktop config generator.
 *
 * Config file: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
 *              %AppData%\Claude\claude_desktop_config.json (Windows)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * This is essentially a passthrough — the canonical format IS the Claude Desktop format.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields, home, appData, configHome } from "./base.js";

export class ClaudeDesktopGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "claude-desktop",
    name: "Claude Desktop",
    description: "Anthropic's Claude desktop application",
    configPaths: {
      darwin: "~/Library/Application Support/Claude/claude_desktop_config.json",
      win32: "%AppData%\\Claude\\claude_desktop_config.json",
      linux: "~/.config/Claude/claude_desktop_config.json",
    },
    configFormat: "json",
    docsUrl: "https://modelcontextprotocol.io/quickstart/user",
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
    switch (process.platform) {
      case "darwin":
        return existsSync(join(home, "Library", "Application Support", "Claude"));
      case "win32":
        return existsSync(join(appData, "Claude"));
      default:
        return existsSync(join(configHome, "Claude"));
    }
  }
}
