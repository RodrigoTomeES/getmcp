/**
 * Gemini CLI config generator.
 *
 * Config file: ~/.gemini/settings.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Gemini CLI uses the same canonical mcpServers format.
 */

import { join } from "node:path";
import type { AppMetadata } from "@getmcp/core";
import { BaseGenerator, home, safeExistsSync } from "./base.js";

export class GeminiCliGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "gemini-cli",
    name: "Gemini CLI",
    description: "Google's Gemini CLI agent",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/.gemini/settings.json",
      win32: "%UserProfile%\\.gemini\\settings.json",
      linux: "~/.gemini/settings.json",
    },
    configFormat: "json",
    docsUrl: "https://github.com/google-gemini/gemini-cli",
  };

  override detectInstalled(): boolean {
    return safeExistsSync(join(home, ".gemini"));
  }
}
