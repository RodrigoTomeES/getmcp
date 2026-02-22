/**
 * Continue config generator.
 *
 * Config file: ~/.continue/config.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Continue uses the same canonical mcpServers format.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields, home } from "./base.js";

export class ContinueGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "continue",
    name: "Continue",
    description: "Open-source AI code assistant for VS Code and JetBrains",
    configPaths: {
      darwin: "~/.continue/config.json",
      win32: "%UserProfile%\\.continue\\config.json",
      linux: "~/.continue/config.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.continue.dev/customize/model-providers/mcp",
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
    return existsSync(join(home, ".continue"));
  }
}
