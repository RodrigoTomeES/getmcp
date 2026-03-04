/**
 * Zod schemas for the canonical MCP configuration format.
 *
 * Aligned with the official MCP registry schema:
 *   - Root key: "mcpServers"
 *   - Stdio: command, args, env, cwd, timeout, description
 *   - Remote: url, transport, headers, timeout, description
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Transport types
// ---------------------------------------------------------------------------

export const TransportType = z.enum(["stdio", "http", "streamable-http", "sse"]);

// ---------------------------------------------------------------------------
// Canonical server configs
// ---------------------------------------------------------------------------

/**
 * Stdio transport server configuration.
 * This is the most common format — runs a local process.
 */
export const StdioServerConfig = z.object({
  /** The executable command (e.g. "npx", "uvx", "docker", "node") */
  command: z.string().min(1),

  /** Arguments passed to the command */
  args: z.array(z.string()).optional().default([]),

  /** Environment variables for the process */
  env: z.record(z.string(), z.string()).optional().default({}),

  /** Transport type — always "stdio" for this variant */
  transport: z.literal("stdio").optional().default("stdio"),

  /** Working directory for command execution */
  cwd: z.string().optional(),

  /** Maximum response time in milliseconds */
  timeout: z.number().int().positive().optional(),

  /** Human-readable server description */
  description: z.string().optional(),
});

/**
 * Remote transport server configuration.
 * Used for HTTP, Streamable HTTP, and SSE servers.
 */
export const RemoteServerConfig = z.object({
  /** The server URL */
  url: z.string().url(),

  /** Transport type — inferred from URL if not provided */
  transport: z.enum(["http", "streamable-http", "sse"]).optional(),

  /** HTTP headers to include with requests */
  headers: z.record(z.string(), z.string()).optional().default({}),

  /** Maximum response time in milliseconds */
  timeout: z.number().int().positive().optional(),

  /** Human-readable server description */
  description: z.string().optional(),
});

/**
 * Union of both transport configurations.
 * Discriminated by the presence of `command` (stdio) vs `url` (remote).
 */
export const ServerConfig = z.discriminatedUnion("transport", [
  StdioServerConfig.extend({ transport: z.literal("stdio") }),
  RemoteServerConfig.extend({ transport: z.literal("http") }),
  RemoteServerConfig.extend({ transport: z.literal("streamable-http") }),
  RemoteServerConfig.extend({ transport: z.literal("sse") }),
]);

/**
 * Loose server config — accepts either stdio or remote without requiring
 * an explicit transport field. Uses the presence of `command` vs `url` to
 * determine the type.
 */
export const LooseServerConfig = z.union([StdioServerConfig, RemoteServerConfig]);

// ---------------------------------------------------------------------------
// Canonical MCP config (root format)
// ---------------------------------------------------------------------------

/**
 * The canonical MCP configuration format.
 * Root format: { mcpServers: { name: config } }
 */
export const CanonicalMCPConfig = z.object({
  mcpServers: z.record(z.string(), LooseServerConfig),
});

// ---------------------------------------------------------------------------
// Category and Runtime enums (shared between core and enrichment)
// ---------------------------------------------------------------------------

export const Category = z.enum([
  "developer-tools",
  "web",
  "automation",
  "data",
  "search",
  "ai",
  "cloud",
  "communication",
  "design",
  "documentation",
  "devops",
  "utilities",
  "security",
  "gaming",
]);

export const Runtime = z.enum(["node", "python", "docker", "binary"]);

// ---------------------------------------------------------------------------
// Registry entry (official MCP registry format + getmcp _meta extensions)
// ---------------------------------------------------------------------------

/**
 * A full MCP server registry entry in the official format.
 * Contains the server definition plus _meta enrichments.
 *
 * This is the format stored in data/servers.json and shipped in the npm package.
 * The registry engine transforms this into internal types for consumers.
 */
export const RegistryEntry = z.object({
  server: z.object({
    $schema: z.string().optional(),
    name: z.string().min(1),
    description: z.string(),
    version: z.string().optional(),
    title: z.string().optional(),
    websiteUrl: z.string().optional(),
    repository: z
      .object({
        url: z.string(),
        source: z.string(),
        id: z.string().optional(),
        subfolder: z.string().optional(),
      })
      .optional(),
    icons: z
      .array(
        z.object({
          src: z.string(),
          mimeType: z.string().optional(),
          sizes: z.union([z.array(z.string()), z.string()]).optional(),
          theme: z.enum(["light", "dark"]).optional(),
        }),
      )
      .optional(),
    packages: z
      .array(
        z.object({
          registryType: z.enum(["npm", "pypi", "oci", "nuget", "mcpb"]),
          identifier: z.string(),
          version: z.string().optional(),
          runtimeHint: z.string().optional(),
          transport: z.object({
            type: z.enum(["stdio", "streamable-http", "sse"]),
            url: z.string().optional(),
          }),
          packageArguments: z
            .array(
              z.object({
                name: z.string().optional(),
                description: z.string().optional(),
                value: z.string().optional(),
                default: z.string().optional(),
                format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
                isRequired: z.boolean().optional(),
                isSecret: z.boolean().optional(),
                type: z.enum(["named", "positional"]).optional(),
                variables: z
                  .record(
                    z.string(),
                    z.object({
                      description: z.string().optional(),
                      format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
                      isRequired: z.boolean().optional(),
                      isSecret: z.boolean().optional(),
                      default: z.string().optional(),
                      placeholder: z.string().optional(),
                      value: z.string().optional(),
                      choices: z.array(z.string()).optional(),
                    }),
                  )
                  .optional(),
                isRepeated: z.boolean().optional(),
                valueHint: z.string().optional(),
                choices: z.array(z.string()).optional(),
                placeholder: z.string().optional(),
              }),
            )
            .optional(),
          runtimeArguments: z
            .array(
              z.object({
                name: z.string().optional(),
                description: z.string().optional(),
                value: z.string().optional(),
                default: z.string().optional(),
                format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
                isRequired: z.boolean().optional(),
                isSecret: z.boolean().optional(),
                type: z.enum(["named", "positional"]).optional(),
                variables: z
                  .record(
                    z.string(),
                    z.object({
                      description: z.string().optional(),
                      format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
                      isRequired: z.boolean().optional(),
                      isSecret: z.boolean().optional(),
                      default: z.string().optional(),
                      placeholder: z.string().optional(),
                      value: z.string().optional(),
                      choices: z.array(z.string()).optional(),
                    }),
                  )
                  .optional(),
                isRepeated: z.boolean().optional(),
                valueHint: z.string().optional(),
                choices: z.array(z.string()).optional(),
                placeholder: z.string().optional(),
              }),
            )
            .optional(),
          environmentVariables: z
            .array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                value: z.string().optional(),
                default: z.string().optional(),
                format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
                isRequired: z.boolean().optional(),
                isSecret: z.boolean().optional(),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
    remotes: z
      .array(
        z.object({
          type: z.enum(["streamable-http", "sse"]),
          url: z.string(),
          headers: z
            .array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                value: z.string().optional(),
                default: z.string().optional(),
                format: z.enum(["string", "number", "boolean", "filepath"]).optional(),
                isRequired: z.boolean().optional(),
                isSecret: z.boolean().optional(),
              }),
            )
            .optional(),
          variables: z
            .record(
              z.string(),
              z.object({
                description: z.string().optional(),
                format: z.string().optional(),
                default: z.string().optional(),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
    _meta: z.record(z.string(), z.unknown()).optional(),
  }),
  _meta: z.record(z.string(), z.unknown()).optional().default({}),
});

// ---------------------------------------------------------------------------
// App identifiers (all supported target apps)
// ---------------------------------------------------------------------------

export const AppId = z.enum([
  "claude-desktop",
  "claude-code",
  "vscode",
  "cursor",
  "cline",
  "roo-code",
  "goose",
  "windsurf",
  "opencode",
  "zed",
  "pycharm",
  "codex",
  "gemini-cli",
  "continue",
  "amazon-q",
  "trae",
  "bolt-ai",
  "libre-chat",
  "antigravity",
]);

// ---------------------------------------------------------------------------
// Registry source configuration
// ---------------------------------------------------------------------------

/**
 * Authentication method for private registries.
 */
export const RegistryAuthMethod = z.enum(["bearer", "basic", "header"]);

/**
 * A registry source definition.
 * Describes where to fetch MCP server definitions from.
 */
export const RegistrySource = z.object({
  /** Unique name for this registry (lowercase alphanumeric + hyphens) */
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  /** Base URL of the registry API */
  url: z.string().url(),
  /** Registry type */
  type: z.enum(["public", "private"]).default("public"),
  /** Priority for conflict resolution (lower number wins) */
  priority: z.number().int().nonnegative().default(100),
});

/**
 * Credentials for authenticating to a private registry.
 */
export const RegistryCredential = z.object({
  /** Authentication method */
  method: RegistryAuthMethod,
  /** Token for bearer or basic auth */
  token: z.string().optional(),
  /** Username for basic auth */
  username: z.string().optional(),
  /** Custom header name for header auth */
  headerName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Project manifest (getmcp.json)
// ---------------------------------------------------------------------------

/**
 * Per-server entry in a project manifest.
 * Allows overriding env vars and specifying app targets.
 */
export const ManifestServerEntry = z.object({
  /** Override environment variables for this server */
  env: z.record(z.string(), z.string()).optional(),
  /** Restrict to specific apps (defaults to all detected) */
  apps: z.array(AppId).optional(),
  /** Override installation scope (project or global) */
  scope: z.enum(["project", "global"]).optional(),
  /** Registry source name (defaults to searching all registries) */
  registry: z.string().optional(),
});

/**
 * Project manifest schema (getmcp.json).
 * Teams commit this file to declare which MCP servers a project needs.
 */
export const ProjectManifest = z.object({
  /** Map of server ID to optional overrides */
  servers: z.record(z.string(), ManifestServerEntry.or(z.object({}))),
  /** Additional registry sources for this project */
  registries: z.array(RegistrySource).optional(),
});
