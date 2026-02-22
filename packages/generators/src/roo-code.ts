/**
 * Roo Code config generator.
 *
 * Config file: mcp_settings.json (global) or .roo/mcp.json (project)
 * Format:      { "mcpServers": { "name": { "command", "args", "env", ... } } }
 *
 * Key differences from canonical:
 *   - Extra fields: "alwaysAllow", "disabled", "timeout", "watchPaths",
 *     "disabledTools", "cwd"
 *   - Remote servers need explicit "type": "streamable-http" or "type": "sse"
 *   - Supports ${env:VARIABLE_NAME} syntax in args
 *   - Windows requires "cmd /c npx" wrapper
 */

import { join } from "node:path";
import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { inferTransport } from "@getmcp/core";
import { BaseGenerator, toStdioFields, home, appData, configHome, safeExistsSync } from "./base.js";

export class RooCodeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "roo-code",
    name: "Roo Code",
    description: "AI coding assistant VS Code extension (formerly Roo Cline)",
    configPaths: null,
    globalConfigPaths: {
      darwin:
        "~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json",
      win32:
        "%AppData%\\Code\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\mcp_settings.json",
      linux:
        "~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.roocode.com/features/mcp/using-mcp-in-roo",
  };

  protected override transformStdio(config: LooseServerConfigType): Record<string, unknown> {
    return {
      ...toStdioFields(config),
      alwaysAllow: [],
      disabled: false,
    };
  }

  protected override transformRemote(config: LooseServerConfigType): Record<string, unknown> {
    if (!("url" in config)) {
      throw new Error("Expected remote config but got stdio config");
    }
    const transport = inferTransport(config as Parameters<typeof inferTransport>[0]);
    return {
      type: transport === "http" ? "streamable-http" : transport,
      url: config.url,
      ...(config.headers && Object.keys(config.headers).length > 0
        ? { headers: config.headers }
        : {}),
      ...(config.timeout ? { timeout: config.timeout } : {}),
      alwaysAllow: [],
      disabled: false,
    };
  }

  override detectInstalled(): boolean {
    const extId = "rooveterinaryinc.roo-cline";
    switch (process.platform) {
      case "darwin":
        return safeExistsSync(
          join(home, "Library", "Application Support", "Code", "User", "globalStorage", extId),
        );
      case "win32":
        return safeExistsSync(join(appData, "Code", "User", "globalStorage", extId));
      default:
        return safeExistsSync(join(configHome, "Code", "User", "globalStorage", extId));
    }
  }
}
