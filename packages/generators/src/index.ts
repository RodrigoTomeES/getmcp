/**
 * @getmcp/generators
 *
 * Config generators that transform canonical MCP server definitions
 * into app-specific configuration formats for 19 AI applications.
 */

import type { AppIdType, ConfigGenerator } from "@getmcp/core";

// Individual generators — imported once, used for both re-export and registry map
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
import { PyCharmGenerator } from "./pycharm.js";
import { CodexGenerator } from "./codex.js";
import { GeminiCliGenerator } from "./gemini-cli.js";
import { ContinueGenerator } from "./continue.js";
import { AmazonQGenerator } from "./amazon-q.js";
import { TraeGenerator } from "./trae.js";
import { BoltAIGenerator } from "./bolt-ai.js";
import { LibreChatGenerator } from "./libre-chat.js";
import { AntigravityGenerator } from "./antigravity.js";

export {
  ClaudeDesktopGenerator,
  ClaudeCodeGenerator,
  VSCodeGenerator,
  CursorGenerator,
  ClineGenerator,
  RooCodeGenerator,
  GooseGenerator,
  WindsurfGenerator,
  OpenCodeGenerator,
  ZedGenerator,
  PyCharmGenerator,
  CodexGenerator,
  GeminiCliGenerator,
  ContinueGenerator,
  AmazonQGenerator,
  TraeGenerator,
  BoltAIGenerator,
  LibreChatGenerator,
  AntigravityGenerator,
};

// Base class and utilities
export {
  BaseGenerator,
  INVALID_CONFIG_ERROR,
  deepMerge,
  toStdioFields,
  toRemoteFields,
  home,
  configHome,
  appData,
  localAppData,
  claudeHome,
  codexHome,
} from "./base.js";

// Re-export core types used by generators
export type { ConfigGenerator, AppMetadata, LooseServerConfigType } from "@getmcp/core";
export type { AppIdType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Generator registry — map of AppId to generator instance
// ---------------------------------------------------------------------------

/**
 * Map of all available generators, keyed by AppId.
 */
export const generators: Record<AppIdType, ConfigGenerator> = {
  "claude-desktop": new ClaudeDesktopGenerator(),
  "claude-code": new ClaudeCodeGenerator(),
  vscode: new VSCodeGenerator(),
  cursor: new CursorGenerator(),
  cline: new ClineGenerator(),
  "roo-code": new RooCodeGenerator(),
  goose: new GooseGenerator(),
  windsurf: new WindsurfGenerator(),
  opencode: new OpenCodeGenerator(),
  zed: new ZedGenerator(),
  pycharm: new PyCharmGenerator(),
  codex: new CodexGenerator(),
  "gemini-cli": new GeminiCliGenerator(),
  continue: new ContinueGenerator(),
  "amazon-q": new AmazonQGenerator(),
  trae: new TraeGenerator(),
  "bolt-ai": new BoltAIGenerator(),
  "libre-chat": new LibreChatGenerator(),
  antigravity: new AntigravityGenerator(),
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
