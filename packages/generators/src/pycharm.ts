/**
 * PyCharm config generator.
 *
 * Config:   .ai/mcp/mcp.json (project-level) or IDE Settings → Tools → AI Assistant → MCP
 * Format:   { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * PyCharm's AI Assistant accepts MCP server configs in the same JSON format
 * as Claude Desktop — essentially a passthrough. Supports stdio, streamable-http,
 * and SSE transports.
 *
 * PyCharm supports project-level MCP configuration via .ai/mcp/mcp.json,
 * similar to how VS Code uses .vscode/mcp.json. This file is shareable via
 * version control and uses the canonical mcpServers format.
 *
 * Requires the JetBrains AI Assistant plugin:
 * https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant
 *
 * Important: PyCharm must be closed and reopened for config changes to take effect.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class PyCharmGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "pycharm",
    name: "PyCharm",
    description: "JetBrains PyCharm IDE with AI Assistant MCP integration",
    configPaths: ".ai/mcp/mcp.json",
    globalConfigPaths: null,
    configFormat: "json",
    docsUrl: "https://www.jetbrains.com/help/ai-assistant/mcp.html",
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
