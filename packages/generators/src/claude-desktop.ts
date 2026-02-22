/**
 * Claude Desktop config generator.
 *
 * Config file: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
 *              %AppData%\Claude\claude_desktop_config.json (Windows)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * This is essentially a passthrough — the canonical format IS the Claude Desktop format.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, appData, configHome, safeExistsSync } from "./base.js";

export class ClaudeDesktopGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "claude-desktop",
    name: "Claude Desktop",
    description: "Anthropic's Claude desktop application",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/Library/Application Support/Claude/claude_desktop_config.json",
      win32: "%AppData%\\Claude\\claude_desktop_config.json",
      linux: "~/.config/Claude/claude_desktop_config.json",
    },
    configFormat: "json",
    docsUrl: "https://modelcontextprotocol.io/quickstart/user",
  };

  override detectInstalled(): boolean {
    switch (process.platform) {
      case "darwin":
        return safeExistsSync(join(home, "Library", "Application Support", "Claude"));
      case "win32":
        return safeExistsSync(join(appData, "Claude"));
      default:
        return safeExistsSync(join(configHome, "Claude"));
    }
  }
}
