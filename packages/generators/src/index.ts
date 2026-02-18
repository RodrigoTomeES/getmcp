/**
 * @getmcp/generators
 *
 * Config generators that transform canonical MCP server definitions
 * into app-specific configuration formats for 10 AI applications.
 */

// Individual generators
export { ClaudeDesktopGenerator } from "./claude-desktop.js";
export { ClaudeCodeGenerator } from "./claude-code.js";
export { VSCodeGenerator } from "./vscode.js";
export { CursorGenerator } from "./cursor.js";
export { ClineGenerator } from "./cline.js";
export { RooCodeGenerator } from "./roo-code.js";
export { GooseGenerator } from "./goose.js";
export { WindsurfGenerator } from "./windsurf.js";
export { OpenCodeGenerator } from "./opencode.js";
export { ZedGenerator } from "./zed.js";

// Base class and utilities
export { BaseGenerator, deepMerge, toStdioFields, toRemoteFields } from "./base.js";

// Re-export core types used by generators
export type { ConfigGenerator, AppMetadata, LooseServerConfigType } from "@getmcp/core";
export type { AppIdType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Generator registry — map of AppId to generator instance
// ---------------------------------------------------------------------------

import type { AppIdType, ConfigGenerator } from "@getmcp/core";
import { ClaudeDesktopGenerator } from "./claude-desktop.js";
import { ClaudeCodeGenerator } from "./claude-code.js";
import { VSCodeGenerator } from "./vscode.js";
import { CursorGenerator } from "./cursor.js";
import { ClineGenerator } from "./cline.js";
import { RooCodeGenerator } from "./roo-code.js";
import { GooseGenerator } from "./goose.js";
import { WindsurfGenerator } from "./windsurf.js";
import { OpenCodeGenerator } from "./opencode.js";
import { ZedGenerator } from "./zed.js";

/**
 * Map of all available generators, keyed by AppId.
 */
export const generators: Record<AppIdType, ConfigGenerator> = {
  "claude-desktop": new ClaudeDesktopGenerator(),
  "claude-code": new ClaudeCodeGenerator(),
  "vscode": new VSCodeGenerator(),
  "cursor": new CursorGenerator(),
  "cline": new ClineGenerator(),
  "roo-code": new RooCodeGenerator(),
  "goose": new GooseGenerator(),
  "windsurf": new WindsurfGenerator(),
  "opencode": new OpenCodeGenerator(),
  "zed": new ZedGenerator(),
};

/**
 * Get a generator by app ID.
 */
export function getGenerator(appId: AppIdType): ConfigGenerator {
  const gen = generators[appId];
  if (!gen) {
    throw new Error(`No generator found for app: ${appId}`);
  }
  return gen;
}

/**
 * Get all available app IDs.
 */
export function getAppIds(): AppIdType[] {
  return Object.keys(generators) as AppIdType[];
}

/**
 * Generate config for a specific app from a canonical server definition.
 */
export function generateConfig(
  appId: AppIdType,
  serverName: string,
  config: import("@getmcp/core").LooseServerConfigType,
): Record<string, unknown> {
  return getGenerator(appId).generate(serverName, config);
}

/**
 * Generate configs for ALL apps from a canonical server definition.
 * Returns a map of AppId -> serialized config string.
 */
export function generateAllConfigs(
  serverName: string,
  config: import("@getmcp/core").LooseServerConfigType,
): Record<AppIdType, string> {
  const result = {} as Record<AppIdType, string>;
  for (const [appId, generator] of Object.entries(generators)) {
    const configObj = generator.generate(serverName, config);
    result[appId as AppIdType] = generator.serialize(configObj);
  }
  return result;
}
