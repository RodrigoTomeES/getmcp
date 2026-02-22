/**
 * Zod schemas for the canonical MCP configuration format.
 *
 * Aligned with FastMCP's CanonicalMCPConfig:
 *   - Root key: "mcpServers"
 *   - Stdio: command, args, env, cwd, timeout, description
 *   - Remote: url, transport, headers, timeout, description
 *
 * Extended with registry metadata for the getmcp ecosystem.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Transport types
// ---------------------------------------------------------------------------

export const TransportType = z.enum(["stdio", "http", "streamable-http", "sse"]);

// ---------------------------------------------------------------------------
// Canonical server configs (FastMCP-compatible)
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
// Canonical MCP config (FastMCP-compatible root format)
// ---------------------------------------------------------------------------

/**
 * The canonical MCP configuration format.
 * This mirrors FastMCP's CanonicalMCPConfig: { mcpServers: { name: config } }
 */
export const CanonicalMCPConfig = z.object({
  mcpServers: z.record(z.string(), LooseServerConfig),
});

// ---------------------------------------------------------------------------
// Platform overrides
// ---------------------------------------------------------------------------

/** Platform-specific command overrides for stdio servers */
export const PlatformOverride = z.object({
  command: z.string().min(1).optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Registry entry (our metadata layer on top of canonical config)
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

/**
 * A full MCP server registry entry.
 * Contains the canonical server config plus metadata for discovery,
 * display, and multi-platform support.
 */
export const RegistryEntry = z.object({
  /** Unique identifier (e.g. "github-mcp-server") */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),

  /** Display name (e.g. "GitHub MCP Server") */
  name: z.string().min(1),

  /** What this server does */
  description: z.string().min(1),

  /** The canonical server configuration */
  config: LooseServerConfig,

  /** Package name (npm or pypi) */
  package: z.string().optional(),

  /** Runtime used to execute the server */
  runtime: Runtime.optional(),

  /** Source code repository URL */
  repository: z.string().url().optional(),

  /** Homepage URL */
  homepage: z.string().url().optional(),

  /** Author or organization */
  author: z.string().optional(),

  /** Discovery categories (e.g. ["developer-tools", "data"]) */
  categories: z.array(Category).optional().default([]),

  /** Environment variables that the user MUST provide */
  requiredEnvVars: z.array(z.string()).optional().default([]),

  /** Platform-specific overrides (e.g. Windows needs cmd /c wrapper) */
  windows: PlatformOverride.optional(),
  linux: PlatformOverride.optional(),
  macos: PlatformOverride.optional(),
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
  "vscode-insiders",
  "bolt-ai",
  "libre-chat",
  "antigravity",
]);

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
});

/**
 * Project manifest schema (getmcp.json).
 * Teams commit this file to declare which MCP servers a project needs.
 */
export const ProjectManifest = z.object({
  /** Map of server ID to optional overrides */
  servers: z.record(z.string(), ManifestServerEntry.or(z.object({}))),
});
