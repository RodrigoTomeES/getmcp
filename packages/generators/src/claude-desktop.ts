/**
 * Claude Desktop config generator.
 *
 * Config file: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
 *              %AppData%\Claude\claude_desktop_config.json (Windows)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * This is essentially a passthrough — the canonical format IS the Claude Desktop format.
 */

import type { AppMetadata, LooseServerConfigType } from "@mcp-hub/core";
import { isStdioConfig, isRemoteConfig } from "@mcp-hub/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

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
  };

  generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown> {
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
