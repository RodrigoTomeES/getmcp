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

export class VSCodeGenerator extends BaseGenerator {
  protected override rootKey = "servers";

  app: AppMetadata = {
    id: "vscode",
    name: "VS Code / GitHub Copilot",
    description: "Visual Studio Code with GitHub Copilot MCP integration",
    configPaths: ".vscode/mcp.json",
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

    // VS Code uses "type" not "transport"
    delete fields.transport;

    return {
      type: transport === "streamable-http" ? "http" : transport,
      ...fields,
    };
  }

  override detectInstalled(): boolean {
    switch (process.platform) {
      case "darwin":
        return safeExistsSync(join(home, "Library", "Application Support", "Code"));
      case "win32":
        return safeExistsSync(join(appData, "Code"));
      default:
        return safeExistsSync(join(configHome, "Code"));
    }
  }
}
