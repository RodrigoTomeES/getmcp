/**
 * Trae config generator.
 *
 * Config file: .trae/mcp.json (project-scoped)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 *
 * Near-passthrough — Trae uses the same canonical mcpServers format.
 * Project-scoped configuration.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class TraeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "trae",
    name: "Trae",
    description: "ByteDance's AI-powered IDE",
    configPaths: {
      darwin: ".trae/mcp.json",
      win32: ".trae/mcp.json",
      linux: ".trae/mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.trae.ai/ide/model-context-protocol-mcp",
    scope: "project",
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
}
