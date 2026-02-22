/**
 * Codex (OpenAI) config generator.
 *
 * Config file: ~/.codex/config.toml (TOML!)
 * Format:
 *   [mcp_servers.server-name]
 *   command = "npx"
 *   args = ["-y", "@package/name"]
 *
 *   [mcp_servers.server-name.env]
 *   API_KEY = "value"
 *
 * Remote (Streamable HTTP):
 *   [mcp_servers.remote-server]
 *   url = "https://mcp.example.com/mcp"
 *
 *   [mcp_servers.remote-server.http_headers]
 *   Authorization = "Bearer token"
 *
 * Key differences from canonical:
 *   - TOML format (not JSON)
 *   - Root key: "mcp_servers" (not "mcpServers")
 *   - "headers" → "http_headers"
 *   - "timeout" → "startup_timeout_sec" (ms to seconds)
 *   - No explicit "transport" field (Codex auto-detects)
 */

import type { AppMetadata, LooseServerConfigType } from "@getmcp/core";
import { isStdioConfig, isRemoteConfig } from "@getmcp/core";
import * as TOML from "smol-toml";
import { BaseGenerator, codexHome, safeExistsSync } from "./base.js";

export class CodexGenerator extends BaseGenerator {
  app: AppMetadata = {
    id: "codex",
    name: "Codex",
    description: "OpenAI's AI coding agent",
    configPaths: ".codex/config.toml",
    globalConfigPaths: {
      darwin: "~/.codex/config.toml",
      win32: "%UserProfile%\\.codex\\config.toml",
      linux: "~/.codex/config.toml",
    },
    configFormat: "toml",
    docsUrl: "https://developers.openai.com/codex/mcp/",
  };

  generate(serverName: string, config: LooseServerConfigType): Record<string, unknown> {
    let serverConfig: Record<string, unknown>;

    if (isStdioConfig(config)) {
      serverConfig = {
        command: config.command,
        ...(config.args && config.args.length > 0 ? { args: config.args } : {}),
        ...(config.env && Object.keys(config.env).length > 0 ? { env: config.env } : {}),
        ...(config.cwd ? { cwd: config.cwd } : {}),
        ...(config.timeout ? { startup_timeout_sec: Math.ceil(config.timeout / 1000) } : {}),
        ...(config.description ? { description: config.description } : {}),
      };
    } else if (isRemoteConfig(config)) {
      serverConfig = {
        url: config.url,
        ...(config.headers && Object.keys(config.headers).length > 0
          ? { http_headers: config.headers }
          : {}),
        ...(config.timeout ? { startup_timeout_sec: Math.ceil(config.timeout / 1000) } : {}),
        ...(config.description ? { description: config.description } : {}),
      };
    } else {
      throw new Error("Invalid config: must have either 'command' or 'url'");
    }

    return {
      mcp_servers: {
        [serverName]: serverConfig,
      },
    };
  }

  /**
   * Serialize to TOML format using the `smol-toml` library.
   */
  override serialize(config: Record<string, unknown>): string {
    return TOML.stringify(config as TOML.TomlPrimitive);
  }

  override detectInstalled(): boolean {
    return safeExistsSync(codexHome);
  }
}
