/**
 * @getmcp/core
 *
 * Core types, schemas, and validation for the getmcp canonical configuration format.
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
  Category,
  Runtime,
  RegistryEntry,
  AppId,
  ManifestServerEntry,
  ProjectManifest,
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
  Category as CategoryType,
  Runtime as RuntimeType,
  RegistryEntry as RegistryEntryType,
  AppId as AppIdType,
  ManifestServerEntry as ManifestServerEntryType,
  ProjectManifest as ProjectManifestType,
  AppMetadata,
  ConfigGenerator,
} from "./types.js";

// Utilities
export { isStdioConfig, isRemoteConfig, inferTransport } from "./utils.js";

// JSON Schema
export { getRegistryEntryJsonSchema } from "./json-schema.js";
