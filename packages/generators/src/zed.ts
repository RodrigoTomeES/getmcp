/**
 * Zed config generator.
 *
 * Config file: settings.json (Zed settings)
 * Format:
 *   {
 *     "context_servers": {
 *       "name": {
 *         "command": "...",
 *         "args": ["..."],
 *         "env": {}
 *       }
 *     }
 *   }
 *
 * Key differences from canonical:
 *   - Root key: "context_servers" (not "mcpServers")
 *   - Otherwise uses standard command/args/env structure
 *   - Remote servers use "url" + "headers"
 *   - Also installable via Zed extensions
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields } from "./base.js";

export class ZedGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "zed",
    name: "Zed",
    description: "High-performance code editor by Zed Industries",
    configPaths: {
      darwin: "~/.config/zed/settings.json",
      win32: "%AppData%\\Zed\\settings.json",
      linux: "~/.config/zed/settings.json",
    },
    configFormat: "json",
    docsUrl: "https://zed.dev/docs/ai/mcp",
    scope: "global",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = toStdioFields(config);
    } else if (isRemoteConfig(config)) {
      serverConfig = {
        url: config.url,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { headers: config.headers }
          : {}),
        ...(config.timeout ? { timeout: config.timeout } : {}),
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      context_servers: {
        [serverName]: serverConfig,
      },
    };
  }
}
