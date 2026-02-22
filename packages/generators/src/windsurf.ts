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

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class WindsurfGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI-powered code editor",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/.codeium/windsurf/mcp_config.json",
      win32: "%UserProfile%\\.codeium\\windsurf\\mcp_config.json",
      linux: "~/.codeium/windsurf/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
  };

  protected override transformRemote(config: LooseServerConfigType): Record<string, unknown> {
    if (!("url" in config)) {
      throw new Error("Expected remote config but got stdio config");
    }
    // Windsurf uses "serverUrl" for HTTP servers
    return {
      serverUrl: config.url,
      ...(config.headers && Object.keys(config.headers).length > 0
        ? { headers: config.headers }
        : {}),
      ...(config.timeout ? { timeout: config.timeout } : {}),
    };
  }

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".codeium", "windsurf"));
  }
}
