/**
 * VS Code / GitHub Copilot config generator.
 *
 * Config file: .vscode/mcp.json (workspace) or user-level mcp.json
 * Format:      { "servers": { "name": { "type": "stdio", "command", "args", "env" } } }
 *
 * Key differences from canonical:
 *   - Root key: "servers" (NOT "mcpServers")
 *   - Requires explicit "type" field on every server ("stdio", "http", "sse")
 *   - Supports "inputs" array for sensitive data prompting
 *   - Supports "envFile" for .env loading
 */

import type { AppMetadata, LooseServerConfigType } from "@mcp-hub/core";
import { isStdioConfig, isRemoteConfig, inferTransport } from "@mcp-hub/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class VSCodeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "vscode",
    name: "VS Code / GitHub Copilot",
    description: "Visual Studio Code with GitHub Copilot MCP integration",
    configPaths: {
      darwin: ".vscode/mcp.json",
      win32: ".vscode/mcp.json",
      linux: ".vscode/mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
  };

  generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = {
        type: "stdio",
        ...toStdioFields(config),
      };
    } else if (isRemoteConfig(config)) {
      const transport = inferTransport(config);
      const fields = toRemoteFields(config);

      // VS Code uses "type" not "transport"
      delete fields.transport;

      serverConfig = {
        type: transport === "streamable-http" ? "http" : transport,
        ...fields,
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      servers: {
        [serverName]: serverConfig,
      },
    };
  }
}
