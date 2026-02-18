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

// ---------------------------------------------------------------------------
// Generator interface
// ---------------------------------------------------------------------------

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

  /** Config file path pattern (with platform placeholders) */
  configPaths: {
    win32?: string;
    darwin?: string;
    linux?: string;
  };

  /** Config file format */
  configFormat: "json" | "jsonc" | "yaml";

  /** URL to the app's MCP documentation */
  docsUrl: string;
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
  generate(
    serverName: string,
    config: LooseServerConfig,
  ): Record<string, unknown>;

  /**
   * Generate the app-specific config for multiple servers.
   * Returns the full config structure including the root key.
   */
  generateAll(
    servers: Record<string, LooseServerConfig>,
  ): Record<string, unknown>;

  /**
   * Serialize the config object to a string (JSON, YAML, etc.)
   */
  serialize(config: Record<string, unknown>): string;
}
