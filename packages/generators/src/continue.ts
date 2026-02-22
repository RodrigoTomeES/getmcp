/**
 * Continue config generator.
 *
 * Config file: ~/.continue/config.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Continue uses the same canonical mcpServers format.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class ContinueGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "continue",
    name: "Continue",
    description: "Open-source AI code assistant for VS Code and JetBrains",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/.continue/config.json",
      win32: "%UserProfile%\\.continue\\config.json",
      linux: "~/.continue/config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.continue.dev/customize/model-providers/mcp",
  };

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".continue"));
  }
}
