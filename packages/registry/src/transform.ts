/**
 * Transform official MCP registry entries into the internal format
 * used by the registry engine, CLI, and web consumers.
 */

import type { RegistryEntryType, LooseServerConfigType } from "@getmcp/core";
import type { GetMCPEnrichmentType } from "./enrichment-types.js";
import { extractServerConfig } from "./extract-config.js";

/**
 * Internal representation used by the registry engine, CLI, and web.
 * This is what consumers get from getServer(), getAllServers(), etc.
 */
export interface InternalRegistryEntry {
  /** Canonical ID — the official reverse-DNS server name */
  id: string;
  /** URL-friendly slug for web routes and config keys */
  slug: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Canonical server config for generators */
  config: LooseServerConfigType;
  /** Package identifier (npm/pypi) */
  package?: string;
  /** Runtime */
  runtime?: string;
  /** Repository URL */
  repository?: string;
  /** Homepage URL */
  homepage?: string;
  /** Author/org */
  author?: string;
  /** Categories */
  categories: string[];
  /** Required environment variables */
  requiredEnvVars: string[];
  /** Detailed env var info (from official format) */
  envVarDetails?: Array<{
    name: string;
    description?: string;
    isSecret?: boolean;
    isRequired?: boolean;
  }>;
  /** Icons from official format */
  icons?: Array<{ src: string; mimeType?: string }>;
  /** License SPDX ID */
  license?: string;
  /** Primary language */
  language?: string;
  /** Tags */
  tags?: string[];
  /** Whether this is an official (first-party) server */
  isOfficial?: boolean;
  /** Registry source name this entry came from */
  registrySource?: string;
}

/**
 * Transform a raw RegistryEntry (official format + _meta) into an InternalRegistryEntry.
 * Returns null if the entry has no installable config.
 */
export function transformToInternal(entry: RegistryEntryType): InternalRegistryEntry | null {
  const server = entry.server;
  const meta = entry._meta ?? {};

  // Get enrichment data
  const enrichment = meta["es.getmcp/enrichment"] as GetMCPEnrichmentType | undefined;

  if (!enrichment?.slug) return null;

  // Extract config
  const extracted = extractServerConfig(entry);
  if (!extracted) return null;

  // Determine display name
  const name =
    server.title ||
    enrichment.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Determine package identifier
  let pkg: string | undefined;
  if (server.packages && server.packages.length > 0) {
    pkg = server.packages[0].identifier;
  }

  return {
    id: server.name,
    slug: enrichment.slug,
    name,
    description: server.description,
    config: extracted.config,
    package: pkg,
    runtime: enrichment.runtime,
    repository: server.repository?.url,
    homepage: server.websiteUrl,
    author: enrichment.author,
    categories: enrichment.categories ?? [],
    requiredEnvVars: extracted.requiredEnvVars,
    envVarDetails: extracted.envVarDetails,
    icons: server.icons?.map((i) => ({ src: i.src, mimeType: i.mimeType })),
    license: enrichment.license,
    language: enrichment.language,
    tags: enrichment.tags,
    isOfficial: enrichment.isOfficial,
  };
}
