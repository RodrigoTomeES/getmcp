/**
 * Claude Code (CLI) config generator.
 *
 * Config file: .mcp.json (project scope) or ~/.claude.json (user scope)
 * Format:      { "mcpServers": { "name": { "command", "args", "env" } } }
 * CLI:         claude mcp add <name> -- <command> [args]
 *
 * Supports stdio, http, sse transports.
 * Supports ${VAR} and ${VAR:-default} env variable syntax.
 *
 * Very similar to Claude Desktop — essentially a passthrough with
 * optional transport type for remote servers.
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import { BaseGenerator, toStdioFields, toRemoteFields } from "./base.js";

export class ClaudeCodeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's CLI-based coding agent",
    configPaths: {
      darwin: ".mcp.json",
      win32: ".mcp.json",
      linux: ".mcp.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp",
  };

  generate(
    serverName: string,
    config: LooseServerConfigType,
  ): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = toStdioFields(config);
    } else if (isRemoteConfig(config)) {
      serverConfig = toRemoteFields(config);
      // Claude Code uses "type" to specify transport for remote
      if (config.transport) {
        serverConfig.type = config.transport;
        delete serverConfig.transport;
      }
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
