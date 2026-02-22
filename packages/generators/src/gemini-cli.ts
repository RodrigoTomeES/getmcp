/**
 * Gemini CLI config generator.
 *
 * Config file: ~/.gemini/settings.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Gemini CLI uses the same canonical mcpServers format.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields, home } from "./base.js";

export class GeminiCliGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "gemini-cli",
    name: "Gemini CLI",
    description: "Google's Gemini CLI agent",
    configPaths: {
      darwin: "~/.gemini/settings.json",
      win32: "%UserProfile%\\.gemini\\settings.json",
      linux: "~/.gemini/settings.json",
    },
    configFormat: "json",
    docsUrl: "https://github.com/google-gemini/gemini-cli",
    scope: "global",
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

  override detectInstalled(): boolean {
    return existsSync(join(home, ".gemini"));
  }
}
