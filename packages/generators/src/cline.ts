/**
 * Cline config generator.
 *
 * Config file: cline_mcp_settings.json
 * Format:      { "mcpServers": { "name": { "command", "args", "env", "alwaysAllow", "disabled" } } }
 *
 * Key differences from canonical:
 *   - Extra fields: "alwaysAllow" (string array), "disabled" (boolean)
 *   - SSE servers use "url" + "headers" instead of "command"/"args"
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields } from "./base.js";

export class ClineGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "cline",
    name: "Cline",
    description: "AI coding assistant VS Code extension",
    configPaths: {
      darwin: "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      win32: "%AppData%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json",
      linux: "~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.cline.bot/mcp-servers/configuring-mcp-servers",
  };

  generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = {
        ...toStdioFields(config),
        alwaysAllow: [],
        disabled: false,
      };
    } else if (isRemoteConfig(config)) {
      serverConfig = {
        url: config.url,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { headers: config.headers }
          : {}),
        alwaysAllow: [],
        disabled: false,
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      mcpServers: {
        [serverName]: serverConfig,
      },
    };
  }
}
