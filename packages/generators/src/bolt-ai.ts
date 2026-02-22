/**
 * Bolt AI config generator.
 *
 * Config file: ~/Library/Application Support/BoltAI/mcp_config.json (macOS only)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Bolt AI uses the same canonical mcpServers format.
 * macOS-only application.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class BoltAIGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "bolt-ai",
    name: "BoltAI",
    description: "Native macOS AI chat client",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/Library/Application Support/BoltAI/mcp_config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.boltai.com/docs/mcp/overview",
  };

  override detectInstalled(): boolean {
    if (process.platform !== "darwin") return false;
    return safeExistsSync(join(home, "Library", "Application Support", "BoltAI"));
  }
}
