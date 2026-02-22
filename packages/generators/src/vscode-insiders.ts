/**
 * VS Code Insiders config generator.
 *
 * Config file: .vscode-insiders/mcp.json (workspace)
 * Format:      { "servers": { "name": { "type": "stdio", "command", "args", "env" } } }
 *
 * Uses the same format as VS Code — root key "servers" with explicit "type" field.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig, inferTransport } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class VSCodeInsidersGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "vscode-insiders",
    name: "VS Code Insiders",
    description: "Visual Studio Code Insiders with GitHub Copilot MCP integration",
    configPaths: {
      darwin: ".vscode-insiders/mcp.json",
      win32: ".vscode-insiders/mcp.json",
      linux: ".vscode-insiders/mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
    scope: "project",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = {
        type: "stdio",
        ...toStdioFields(config),
      };
    } else if (isRemoteConfig(config)) {
      const transport = inferTransport(config);
      const fields = toRemoteFields(config);

      // VS Code Insiders uses "type" not "transport"
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
