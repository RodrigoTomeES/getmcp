/**
 * @getmcp/core
 *
 * Core types, schemas, and validation for the getmcp canonical configuration format.
 * Aligned with the official MCP registry schema.
 */

// Zod schemas (runtime validation)
export {
  TransportType,
  StdioServerConfig,
  RemoteServerConfig,
  ServerConfig,
  LooseServerConfig,
  CanonicalMCPConfig,
  Category,
  Runtime,
  RegistryEntry,
  AppId,
  RegistryAuthMethod,
  RegistrySource,
  RegistryCredential,
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
  Category as CategoryType,
  Runtime as RuntimeType,
  RegistryEntry as RegistryEntryType,
  AppId as AppIdType,
  RegistryAuthMethod as RegistryAuthMethodType,
  RegistrySource as RegistrySourceType,
  RegistryCredential as RegistryCredentialType,
  ManifestServerEntry as ManifestServerEntryType,
  ProjectManifest as ProjectManifestType,
  PlatformPaths,
  AppMetadata,
  ConfigGenerator,
} from "./types.js";

// Utilities
export { isStdioConfig, isRemoteConfig, inferTransport } from "./utils.js";
export { supportsBothScopes, getDefaultScope } from "./types.js";
