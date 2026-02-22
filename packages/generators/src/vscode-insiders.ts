/**
 * VS Code Insiders config generator.
 *
 * Config file: .vscode-insiders/mcp.json (workspace)
 * Format:      { "servers": { "name": { "type": "stdio", "command", "args", "env" } } }
 *
 * Uses the same format as VS Code — root key "servers" with explicit "type" field.
 */

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig, inferTransport } from "@getmcp/core";
import {
  BaseGenerator,
  toStdioFields,
  toRemoteFields,
  home,
  appData,
  configHome,
  safeExistsSync,
} from "./base.js";

export class VSCodeInsidersGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "vscode-insiders",
    name: "VS Code Insiders",
    description: "Visual Studio Code Insiders with GitHub Copilot MCP integration",
    configPaths: ".vscode-insiders/mcp.json",
    globalConfigPaths: null,
    configFormat: "json",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
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

  override detectInstalled(): boolean {
    switch (process.platform) {
      case "darwin":
        return safeExistsSync(join(home, "Library", "Application Support", "Code - Insiders"));
      case "win32":
        return safeExistsSync(join(appData, "Code - Insiders"));
      default:
        return safeExistsSync(join(configHome, "Code - Insiders"));
    }
  }
}
