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
import { BaseGenerator, toRemoteFields, claudeHome, safeExistsSync } from "./base.js";

export class ClaudeCodeGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's CLI-based coding agent",
    configPaths: ".mcp.json",
    globalConfigPaths: {
      darwin: "~/.claude.json",
      win32: "%UserProfile%\\.claude.json",
      linux: "~/.claude.json",
    },
    configFormat: "json",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp",
  };

  protected override transformRemote(config: LooseServerConfigType): Record<string, unknown> {
    const fields = toRemoteFields(config);
    // Claude Code uses "type" to specify transport for remote
    if ("transport" in config && config.transport) {
      fields.type = config.transport;
      delete fields.transport;
    }
    return fields;
  }

  override detectInstalled(): boolean {
    return safeExistsSync(claudeHome);
  }
}
