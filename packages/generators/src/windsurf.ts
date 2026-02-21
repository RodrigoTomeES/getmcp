/**
 * Windsurf config generator.
 *
 * Config file: ~/.codeium/windsurf/mcp_config.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Key differences from canonical:
 *   - Remote HTTP servers use "serverUrl" (not "url")
 *   - Supports ${env:VARIABLE_NAME} interpolation
 *   - Has MCP Marketplace and admin whitelist controls
 *   - Very similar to Claude Desktop for stdio
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields } from "./base.js";

export class WindsurfGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI-powered code editor",
    configPaths: {
      darwin: "~/.codeium/windsurf/mcp_config.json",
      win32: "%UserProfile%\\.codeium\\windsurf\\mcp_config.json",
      linux: "~/.codeium/windsurf/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
    scope: "global",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = toStdioFields(config);
    } else if (isRemoteConfig(config)) {
      // Windsurf uses "serverUrl" for HTTP servers
      serverConfig = {
        serverUrl: config.url,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { headers: config.headers }
          : {}),
      };
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
