/**
 * Cursor config generator.
 *
 * Config file: .cursor/mcp.json (project) or global settings
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Very similar to Claude Desktop — essentially a passthrough.
 * Supports stdio and SSE transports.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class CursorGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "cursor",
    name: "Cursor",
    description: "Cursor AI-powered code editor",
    configPaths: ".cursor/mcp.json",
    globalConfigPaths: {
      darwin: "~/.cursor/mcp.json",
      win32: "%UserProfile%\\.cursor\\mcp.json",
      linux: "~/.cursor/mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.cursor.com/context/model-context-protocol",
  };

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".cursor"));
  }
}
