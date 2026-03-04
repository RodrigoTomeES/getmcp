/**
 * Zod schemas matching the official MCP registry API format.
 * Based on live data from registry.modelcontextprotocol.io/v0.1/servers
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const KeyValueInput = z.object({
  name: z.string(),
  description: z.string().optional(),
  value: z.string().optional(),
  default: z.string().optional(),
  format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
});

export const ArgumentVariableInput = z.object({
  description: z.string().optional(),
  format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  default: z.string().optional(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  choices: z.array(z.string()).optional(),
});

export const Argument = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  value: z.string().optional(),
  default: z.string().optional(),
  format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  type: z.enum(["named", "positional"]).optional(),
  variables: z.record(z.string(), ArgumentVariableInput).optional(),
  isRepeated: z.boolean().optional(),
  valueHint: z.string().optional(),
  choices: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Package (stdio-based servers distributed via registries)
// ---------------------------------------------------------------------------

export const OfficialPackage = z.object({
  registryType: z.enum(["npm", "pypi", "oci", "nuget", "mcpb"]),
  identifier: z.string(),
  version: z.string().optional(),
  runtimeHint: z.string().optional(),
  transport: z.object({
    type: z.enum(["stdio", "streamable-http", "sse"]),
    url: z.string().optional(),
  }),
  packageArguments: z.array(Argument).optional(),
  runtimeArguments: z.array(Argument).optional(),
  environmentVariables: z.array(KeyValueInput).optional(),
});

// ---------------------------------------------------------------------------
// Remote (hosted servers accessible via HTTP)
// ---------------------------------------------------------------------------

export const RemoteVariable = z.object({
  description: z.string().optional(),
  format: z.string().optional(),
  default: z.string().optional(),
});

export const OfficialRemote = z.object({
  type: z.enum(["streamable-http", "sse"]),
  url: z.string(),
  headers: z.array(KeyValueInput).optional(),
  variables: z.record(z.string(), RemoteVariable).optional(),
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

export const OfficialIcon = z.object({
  src: z.string(),
  mimeType: z.string().optional(),
  sizes: z.union([z.array(z.string()), z.string()]).optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const OfficialRepository = z.object({
  url: z.string(),
  source: z.string(),
  id: z.string().optional(),
  subfolder: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Server (the core server object)
// ---------------------------------------------------------------------------

export const OfficialServer = z.object({
  $schema: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  version: z.string().optional(),
  title: z.string().optional(),
  websiteUrl: z.string().optional(),
  repository: OfficialRepository.optional(),
  icons: z.array(OfficialIcon).optional(),
  packages: z.array(OfficialPackage).optional(),
  remotes: z.array(OfficialRemote).optional(),
  _meta: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Official _meta namespace
// ---------------------------------------------------------------------------

export const OfficialMeta = z.object({
  status: z.enum(["active", "deprecated", "deleted"]),
  publishedAt: z.string(),
  updatedAt: z.string(),
  isLatest: z.boolean(),
});

export const PublisherProvidedMeta = z.object({
  documentation: z.string().optional(),
  examples: z.array(z.unknown()).optional(),
  keywords: z.array(z.string()).optional(),
  license: z.string().optional(),
  notes: z.array(z.string()).optional(),
  publisher: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Response wrappers (API responses)
// ---------------------------------------------------------------------------

export const OfficialServerResponse = z.object({
  server: OfficialServer,
  _meta: z.record(z.string(), z.unknown()).optional().default({}),
});

export const OfficialServerListResponse = z.object({
  servers: z.array(OfficialServerResponse),
  metadata: z.object({
    count: z.number(),
    nextCursor: z.string().optional(),
  }),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type KeyValueInputType = z.infer<typeof KeyValueInput>;
export type ArgumentType = z.infer<typeof Argument>;
export type OfficialPackageType = z.infer<typeof OfficialPackage>;
export type OfficialRemoteType = z.infer<typeof OfficialRemote>;
export type OfficialIconType = z.infer<typeof OfficialIcon>;
export type OfficialRepositoryType = z.infer<typeof OfficialRepository>;
export type OfficialServerType = z.infer<typeof OfficialServer>;
export type OfficialMetaType = z.infer<typeof OfficialMeta>;
export type OfficialServerResponseType = z.infer<typeof OfficialServerResponse>;
export type OfficialServerListResponseType = z.infer<typeof OfficialServerListResponse>;
