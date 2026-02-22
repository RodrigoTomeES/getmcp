/**
 * Google Antigravity IDE config generator.
 *
 * Config file: ~/.gemini/antigravity/mcp_config.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Antigravity uses the same canonical mcpServers format.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class AntigravityGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "antigravity",
    name: "Antigravity",
    description: "Google's AI-first IDE",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/.gemini/antigravity/mcp_config.json",
      win32: "%UserProfile%\\.gemini\\antigravity\\mcp_config.json",
      linux: "~/.gemini/antigravity/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://antigravity.google/docs/mcp",
  };

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".gemini", "antigravity"));
  }
}
