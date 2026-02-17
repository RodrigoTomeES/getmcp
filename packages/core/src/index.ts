/**
 * @mcp-hub/core
 *
 * Core types, schemas, and validation for the MCP Hub canonical configuration format.
 * Aligned with FastMCP's CanonicalMCPConfig standard.
 */

// Zod schemas (runtime validation)
export {
  TransportType,
  StdioServerConfig,
  RemoteServerConfig,
  ServerConfig,
  LooseServerConfig,
  CanonicalMCPConfig,
  PlatformOverride,
  Runtime,
  RegistryEntry,
  AppId,
} from "./schemas.js";

// TypeScript types (compile-time)
export type {
  TransportType as TransportTypeType,
  StdioServerConfig as StdioServerConfigType,
  RemoteServerConfig as RemoteServerConfigType,
  ServerConfig as ServerConfigType,
  LooseServerConfig as LooseServerConfigType,
  CanonicalMCPConfig as CanonicalMCPConfigType,
  PlatformOverride as PlatformOverrideType,
  Runtime as RuntimeType,
  RegistryEntry as RegistryEntryType,
  AppId as AppIdType,
  AppMetadata,
  ConfigGenerator,
} from "./types.js";

// Utilities
export { isStdioConfig, isRemoteConfig, inferTransport } from "./utils.js";
