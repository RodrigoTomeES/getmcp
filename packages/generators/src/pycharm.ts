/**
 * PyCharm config generator.
 *
 * Config:   Managed via IDE Settings → Tools → AI Assistant → Model Context Protocol (MCP)
 * Format:   { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * PyCharm's AI Assistant accepts MCP server configs in the same JSON format
 * as Claude Desktop — essentially a passthrough. Supports stdio, streamable-http,
 * and SSE transports.
 *
 * Note: PyCharm stores MCP configs internally in version-specific IDE directories
 * (e.g. %AppData%\JetBrains\PyCharm2025.3\), so there is no fixed config file
 * path for auto-detection. Users paste the generated JSON into the IDE settings UI.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class PyCharmGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "pycharm",
    name: "PyCharm",
    description: "JetBrains PyCharm IDE with AI Assistant MCP integration",
    configPaths: {},
    configFormat: "json",
    docsUrl: "https://www.jetbrains.com/help/ai-assistant/mcp.html",
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
