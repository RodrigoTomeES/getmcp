/**
 * Utility functions for working with canonical MCP server configs.
 */

import type {
  LooseServerConfig,
  StdioServerConfig,
  RemoteServerConfig,
  TransportType,
} from "./types.js";

/**
 * Type guard: checks if a config is a stdio transport config.
 */
export function isStdioConfig(config: LooseServerConfig): config is StdioServerConfig {
  return "command" in config && typeof config.command === "string";
}

/**
 * Type guard: checks if a config is a remote transport config.
 */
export function isRemoteConfig(config: LooseServerConfig): config is RemoteServerConfig {
  return "url" in config && typeof config.url === "string";
}

/**
 * Infer the transport type from a server config.
 *
 * For stdio configs, always returns "stdio".
 * For remote configs, uses the explicit `transport` field if set,
 * otherwise infers from the URL (paths containing "/sse" → "sse", else "http").
 */
export function inferTransport(config: LooseServerConfig): TransportType {
  if (isStdioConfig(config)) {
    return "stdio";
  }

  if (isRemoteConfig(config)) {
    if (config.transport) {
      return config.transport;
    }
    // Infer from URL (matches FastMCP's logic)
    try {
      const url = new URL(config.url);
      if (/\/sse(\/|\?|&|$)/.test(url.pathname)) {
        return "sse";
      }
    } catch {
      // Invalid URL, fall through
    }
    return "http";
  }

  return "stdio";
}
