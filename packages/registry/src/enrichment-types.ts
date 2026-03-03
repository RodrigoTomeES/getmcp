/**
 * getmcp enrichment schemas stored in _meta extensions.
 * Uses the es.getmcp/ reverse-DNS namespace.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Categories (same values as before, now in enrichment)
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
// es.getmcp/enrichment — stable metadata (Tier 1)
// ---------------------------------------------------------------------------

export const GetMCPEnrichment = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  categories: z.array(Category).default([]),
  author: z.string().optional(),
  license: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  runtime: Runtime.optional(),
  isOfficial: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// es.getmcp/metrics — volatile data (Tier 2)
// ---------------------------------------------------------------------------

export const GitHubMetrics = z.object({
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number().optional(),
  lastPush: z.string().optional(),
  archived: z.boolean().optional(),
});

export const NpmMetrics = z.object({
  weeklyDownloads: z.number(),
  latestVersion: z.string().optional(),
  hasTypes: z.boolean().optional(),
});

export const PyPIMetrics = z.object({
  weeklyDownloads: z.number().optional(),
  latestVersion: z.string().optional(),
});

export const DockerMetrics = z.object({
  pulls: z.number(),
  imageSize: z.number().optional(),
});

export const GetMCPMetrics = z.object({
  github: GitHubMetrics.optional(),
  npm: NpmMetrics.optional(),
  pypi: PyPIMetrics.optional(),
  docker: DockerMetrics.optional(),
  fetchedAt: z.string(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CategoryType = z.infer<typeof Category>;
export type RuntimeType = z.infer<typeof Runtime>;
export type GetMCPEnrichmentType = z.infer<typeof GetMCPEnrichment>;
export type GetMCPMetricsType = z.infer<typeof GetMCPMetrics>;
export type GitHubMetricsType = z.infer<typeof GitHubMetrics>;
export type NpmMetricsType = z.infer<typeof NpmMetrics>;
export type PyPIMetricsType = z.infer<typeof PyPIMetrics>;
export type DockerMetricsType = z.infer<typeof DockerMetrics>;
