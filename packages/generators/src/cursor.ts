/**
 * Cursor config generator.
 *
 * Config file: .cursor/mcp.json (project) or global settings
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Very similar to Claude Desktop — essentially a passthrough.
 * Supports stdio and SSE transports.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class CursorGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "cursor",
    name: "Cursor",
    description: "Cursor AI-powered code editor",
    configPaths: {
      darwin: ".cursor/mcp.json",
      win32: ".cursor/mcp.json",
      linux: ".cursor/mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.cursor.com/context/model-context-protocol",
    scope: "project",
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
