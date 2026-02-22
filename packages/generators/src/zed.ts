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

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { BaseGenerator, toStdioFields, configHome, appData, safeExistsSync } from "./base.js";

export class ZedGenerator extends BaseGenerator {
  protected override rootKey = "context_servers";

  app: AppMetadata = {
    id: "zed",
    name: "Zed",
    description: "High-performance code editor by Zed Industries",
    configPaths: null,
    globalConfigPaths: {
      darwin: "~/.config/zed/settings.json",
      win32: "%AppData%\\Zed\\settings.json",
      linux: "~/.config/zed/settings.json",
    },
    configFormat: "json",
    docsUrl: "https://zed.dev/docs/ai/mcp",
  };

  protected override transformStdio(config: LooseServerConfigType): Record<string, unknown> {
    return toStdioFields(config);
  }

  protected override transformRemote(config: LooseServerConfigType): Record<string, unknown> {
    if (!("url" in config)) {
      throw new Error("Expected remote config but got stdio config");
    }
    return {
      url: config.url,
      ...(config.headers && Object.keys(config.headers).length > 0
        ? { headers: config.headers }
        : {}),
      ...(config.timeout ? { timeout: config.timeout } : {}),
    };
  }

  override detectInstalled(): boolean {
    switch (process.platform) {
      case "win32":
        return safeExistsSync(join(appData, "Zed"));
      default:
        return safeExistsSync(join(configHome, "zed"));
    }
  }
}
