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
import { inferTransport } from "@getmcp/core";
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
  protected override rootKey = "servers";

  app: AppMetadata = {
    id: "vscode-insiders",
    name: "VS Code Insiders",
    description: "Visual Studio Code Insiders with GitHub Copilot MCP integration",
    configPaths: ".vscode-insiders/mcp.json",
    globalConfigPaths: null,
    configFormat: "json",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
  };

  protected override transformStdio(config: LooseServerConfigType): Record<string, unknown> {
    return {
      type: "stdio",
      ...toStdioFields(config),
    };
  }

  protected override transformRemote(config: LooseServerConfigType): Record<string, unknown> {
    const transport = inferTransport(config as Parameters<typeof inferTransport>[0]);
    const fields = toRemoteFields(config);

    // VS Code Insiders uses "type" not "transport"
    delete fields.transport;

    return {
      type: transport === "streamable-http" ? "http" : transport,
      ...fields,
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
