/**
 * TypeScript types inferred from Zod schemas.
 *
 * These types are the single source of truth — derived directly from
 * the schemas so they can never drift out of sync.
 */

import { z } from "zod";
import {
  TransportType,
  StdioServerConfig,
  RemoteServerConfig,
  ServerConfig,
  LooseServerConfig,
  CanonicalMCPConfig,
  PlatformOverride,
  Category,
  Runtime,
  RegistryEntry,
  AppId,
  ManifestServerEntry,
  ProjectManifest,
} from "./schemas.js";

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export type TransportType = z.infer<typeof TransportType>;

// ---------------------------------------------------------------------------
// Server configs
// ---------------------------------------------------------------------------

export type StdioServerConfig = z.infer<typeof StdioServerConfig>;
export type RemoteServerConfig = z.infer<typeof RemoteServerConfig>;
export type ServerConfig = z.infer<typeof ServerConfig>;
export type LooseServerConfig = z.infer<typeof LooseServerConfig>;

// ---------------------------------------------------------------------------
// Canonical config
// ---------------------------------------------------------------------------

export type CanonicalMCPConfig = z.infer<typeof CanonicalMCPConfig>;

// ---------------------------------------------------------------------------
// Platform & registry
// ---------------------------------------------------------------------------

export type PlatformOverride = z.infer<typeof PlatformOverride>;
export type Category = z.infer<typeof Category>;
export type Runtime = z.infer<typeof Runtime>;
export type RegistryEntry = z.infer<typeof RegistryEntry>;
export type AppId = z.infer<typeof AppId>;
export type ManifestServerEntry = z.infer<typeof ManifestServerEntry>;
export type ProjectManifest = z.infer<typeof ProjectManifest>;

// ---------------------------------------------------------------------------
// Generator interface
// ---------------------------------------------------------------------------

/**
 * Platform-specific paths for global config files.
 */
export type PlatformPaths = {
  win32?: string;
  darwin?: string;
  linux?: string;
};

/**
 * Metadata about a target application.
 * Used by the CLI for auto-detection and display.
 */
export interface AppMetadata {
  /** Unique app identifier */
  id: AppId;

  /** Human-readable app name */
  name: string;

  /** Brief description of the app */
  description: string;

  /**
   * Project-scoped config path (relative to project root, same on all platforms).
   * null if the app doesn't support project-scoped config.
   */
  configPaths: string | null;

  /**
   * Global config paths (platform-specific, may use ~ or %AppData%).
   * null if the app doesn't support global config.
   */
  globalConfigPaths: PlatformPaths | null;

  /** Config file format */
  configFormat: "json" | "jsonc" | "yaml" | "toml";

  /** URL to the app's MCP documentation */
  docsUrl: string;
}

/**
 * Check if an app supports both project and global scopes.
 */
export function supportsBothScopes(app: AppMetadata): boolean {
  return app.configPaths !== null && app.globalConfigPaths !== null;
}

/**
 * Get the default scope for an app.
 * Project-capable apps default to project, otherwise global.
 */
export function getDefaultScope(app: AppMetadata): "project" | "global" {
  return app.configPaths !== null ? "project" : "global";
}

/**
 * A config generator transforms canonical server configs into
 * app-specific configuration format.
 */
export interface ConfigGenerator {
  /** The target app metadata */
  app: AppMetadata;

  /**
   * Generate the app-specific config object for a single server.
   * Returns the full config structure including the root key.
   */
  generate(serverName: string, config: LooseServerConfig): Record<string, unknown>;

  /**
   * Generate the app-specific config for multiple servers.
   * Returns the full config structure including the root key.
   */
  generateAll(servers: Record<string, LooseServerConfig>): Record<string, unknown>;

  /**
   * Serialize the config object to a string (JSON, YAML, etc.)
   */
  serialize(config: Record<string, unknown>): string;

  /**
   * Check if this app is installed on the current system.
   * Uses platform-specific heuristics (e.g., checking for config directories).
   */
  detectInstalled(): boolean;
}
