/**
 * Sync pipeline: fetch from official MCP registry, enrich, and write data/servers.json.
 *
 * Usage: npx tsx packages/registry/scripts/sync.ts [--full]
 * Env:   GITHUB_TOKEN (required for GitHub enrichment)
 *        PULSEMCP_API_KEY (optional, for future PulseMCP source)
 *
 * By default, runs an incremental sync using `updated_since` from the last
 * sync metadata. Pass `--full` to force a complete re-sync of all entries.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSlugs } from "../src/id-mapping.js";
import { fetchGitHubRepo, parseGitHubUrl, buildEnrichment } from "../src/enrich.js";
import { fetchMetricsForEntry, withConcurrency } from "../src/fetch-metrics.js";
import type { OfficialServerResponseType } from "../src/official-api-types.js";
import type { GetMCPEnrichmentType } from "../src/enrichment-types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "servers.json");
const METADATA_FILE = path.join(DATA_DIR, "sync-metadata.json");
const OFFICIAL_SERVERS_FILE = path.join(DATA_DIR, "official-servers.json");

const OFFICIAL_API = "https://registry.modelcontextprotocol.io/v0.1/servers";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CONCURRENCY = 10;
const FORCE_FULL = process.argv.includes("--full");

// ---------------------------------------------------------------------------
// Registry source abstraction
// ---------------------------------------------------------------------------

interface FetchOptions {
  version?: string;
  updatedSince?: string;
}

interface RegistrySource {
  name: string;
  fetchAll(options?: FetchOptions): AsyncGenerator<OfficialServerResponseType>;
}

class OfficialRegistrySource implements RegistrySource {
  name = "official";

  async *fetchAll(options?: FetchOptions): AsyncGenerator<OfficialServerResponseType> {
    let cursor: string | undefined;
    let page = 0;

    while (true) {
      const url = new URL(OFFICIAL_API);
      url.searchParams.set("limit", "100");
      if (options?.version) url.searchParams.set("version", options.version);
      if (options?.updatedSince) url.searchParams.set("updated_since", options.updatedSince);
      if (cursor) url.searchParams.set("cursor", cursor);

      log(`  Fetching page ${++page} from official registry...`);

      const resp = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        throw new Error(`Official API returned ${resp.status}: ${resp.statusText}`);
      }

      const data = (await resp.json()) as {
        servers: OfficialServerResponseType[];
        metadata: { nextCursor?: string; count: number };
      };

      for (const entry of data.servers) {
        yield entry;
      }

      cursor = data.metadata.nextCursor;
      if (!cursor || data.servers.length === 0) break;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[sync] ${msg}`);
}

function loadExistingServers(): OfficialServerResponseType[] {
  if (!fs.existsSync(OUTPUT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8")) as OfficialServerResponseType[];
  } catch {
    log("WARNING: Could not parse existing servers.json, falling back to full sync.");
    return [];
  }
}

function loadSyncMetadata(): { syncedAt?: string } | null {
  if (!fs.existsSync(METADATA_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8")) as { syncedAt?: string };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startTime = Date.now();

  log("Starting sync pipeline...");
  if (!GITHUB_TOKEN) {
    log("WARNING: GITHUB_TOKEN not set. GitHub enrichment will be rate-limited.");
  }

  // Determine sync mode
  const previousMetadata = loadSyncMetadata();
  const existingServers = loadExistingServers();
  const isIncremental = !FORCE_FULL && !!previousMetadata?.syncedAt && existingServers.length > 0;

  if (isIncremental) {
    log(`Incremental sync (since ${previousMetadata!.syncedAt})`);
  } else {
    log("Full sync" + (FORCE_FULL ? " (forced)" : ""));
  }

  // Step 1: Fetch entries from API
  const source = new OfficialRegistrySource();
  const fetchOptions: FetchOptions = { version: "latest" };
  if (isIncremental) {
    fetchOptions.updatedSince = previousMetadata!.syncedAt;
  }

  const rawEntries: OfficialServerResponseType[] = [];
  log(`Fetching from ${source.name}...`);
  for await (const entry of source.fetchAll(fetchOptions)) {
    rawEntries.push(entry);
  }
  log(`Fetched ${rawEntries.length} entries from API.`);

  // Step 2: Filter fetched entries (dedup + active check + installable check)
  const fetchedFiltered = new Map<string, OfficialServerResponseType>();
  const inactiveNames = new Set<string>();

  for (const entry of rawEntries) {
    const name = entry.server.name;
    const meta = entry._meta?.["io.modelcontextprotocol.registry/official"] as
      | { status?: string }
      | undefined;

    // Track entries that became inactive (for incremental removal)
    if (meta?.status && meta.status !== "active") {
      inactiveNames.add(name);
      continue;
    }

    // Skip entries with no installable config
    if (
      (!entry.server.packages || entry.server.packages.length === 0) &&
      (!entry.server.remotes || entry.server.remotes.length === 0)
    ) {
      continue;
    }

    fetchedFiltered.set(name, entry);
  }

  // Step 3: Build the complete dataset
  let baseData: Map<string, OfficialServerResponseType>;

  if (isIncremental) {
    // Start from existing data
    baseData = new Map<string, OfficialServerResponseType>();
    for (const entry of existingServers) {
      baseData.set(entry.server.name, entry);
    }

    // Remove entries that became inactive
    for (const name of inactiveNames) {
      if (baseData.has(name)) {
        log(`  Removing inactive server: ${name}`);
        baseData.delete(name);
      }
    }

    // Merge updated entries (update server data + official meta, preserve enrichment/metrics)
    for (const [name, entry] of fetchedFiltered) {
      const existing = baseData.get(name);
      if (existing) {
        const mergedMeta: Record<string, unknown> = { ...(existing._meta ?? {}) };
        // Update official and publisher-provided meta from API response
        if (entry._meta?.["io.modelcontextprotocol.registry/official"]) {
          mergedMeta["io.modelcontextprotocol.registry/official"] =
            entry._meta["io.modelcontextprotocol.registry/official"];
        }
        if (entry._meta?.["io.modelcontextprotocol.registry/publisher-provided"]) {
          mergedMeta["io.modelcontextprotocol.registry/publisher-provided"] =
            entry._meta["io.modelcontextprotocol.registry/publisher-provided"];
        }
        baseData.set(name, { server: entry.server, _meta: mergedMeta });
      } else {
        baseData.set(name, entry);
      }
    }

    log(
      `After merge: ${baseData.size} entries (${fetchedFiltered.size} updated, ${inactiveNames.size} removed).`,
    );
  } else {
    baseData = fetchedFiltered;
    log(`After filter: ${baseData.size} entries.`);
  }

  // Step 4: Generate slug IDs (from full dataset to maintain collision resolution)
  const allNames = Array.from(baseData.keys());
  const slugMap = generateSlugs(allNames);
  log(`Generated ${slugMap.size} slugs.`);

  // Step 5: Enrich with GitHub data (only for new/updated entries in incremental mode)
  const entriesToEnrich = isIncremental
    ? Array.from(fetchedFiltered.entries())
    : Array.from(baseData.entries());

  log(`Enriching ${entriesToEnrich.length} entries with GitHub data...`);
  let enrichCount = 0;

  const enriched = await withConcurrency(entriesToEnrich, CONCURRENCY, async ([name, entry]) => {
    const slug = slugMap.get(name) ?? name;
    const repoUrl = entry.server.repository?.url;
    const registryType = entry.server.packages?.[0]?.registryType;

    // Get publisher-provided keywords
    const publisherMeta = entry._meta?.["io.modelcontextprotocol.registry/publisher-provided"] as
      | { keywords?: string[]; license?: string; publisher?: string }
      | undefined;

    let repoInfo = null;
    if (repoUrl) {
      const parsed = parseGitHubUrl(repoUrl);
      if (parsed) {
        repoInfo = await fetchGitHubRepo(parsed.owner, parsed.repo, GITHUB_TOKEN);
        if (repoInfo) enrichCount++;
      }
    }

    const enrichment = buildEnrichment(slug, repoInfo, registryType, publisherMeta?.keywords);

    // Merge publisher license if GitHub didn't have one
    if (!enrichment.license && publisherMeta?.license) {
      enrichment.license = publisherMeta.license;
    }

    // Use publisher as author fallback
    if (!enrichment.author && publisherMeta?.publisher) {
      enrichment.author = publisherMeta.publisher;
    }

    // Use title as author fallback
    if (!enrichment.author && entry.server.title) {
      enrichment.author = entry.server.title;
    }

    return { name, entry, enrichment, repoInfo };
  });

  log(`Enriched ${enrichCount} entries with GitHub data.`);

  // Step 6: Fetch metrics (only for new/updated entries in incremental mode)
  log(`Fetching metrics for ${enriched.length} entries...`);
  let metricsCount = 0;

  const withMetrics = await withConcurrency(enriched, CONCURRENCY, async (item) => {
    const { entry } = item;
    const packages = entry.server.packages?.map((p) => ({
      registryType: p.registryType,
      identifier: p.identifier,
    }));

    const metrics = await fetchMetricsForEntry(entry.server.repository?.url, packages, {
      githubToken: GITHUB_TOKEN,
    });

    if (metrics) metricsCount++;

    return { ...item, metrics };
  });

  log(`Fetched metrics for ${metricsCount} entries.`);

  // Step 7: Apply enrichment results back to baseData
  for (const { name, entry, enrichment, metrics } of withMetrics) {
    const _meta: Record<string, unknown> = { ...(baseData.get(name)?._meta ?? entry._meta ?? {}) };

    _meta["es.getmcp/enrichment"] = enrichment;

    if (metrics) {
      _meta["es.getmcp/metrics"] = {
        ...metrics,
        fetchedAt: new Date().toISOString(),
      };
    }

    baseData.set(name, { server: entry.server, _meta });
  }

  // Step 7a: Update slugs for ALL entries (not just enriched ones)
  // This ensures slug changes from id-mapping fixes apply to existing entries too
  for (const [name, entry] of baseData) {
    const _meta = (entry._meta ?? {}) as Record<string, unknown>;
    const enrichment = _meta["es.getmcp/enrichment"] as Record<string, unknown> | undefined;
    const newSlug = slugMap.get(name);
    if (enrichment && newSlug && enrichment.slug !== newSlug) {
      _meta["es.getmcp/enrichment"] = { ...enrichment, slug: newSlug };
      baseData.set(name, { server: entry.server, _meta });
    }
  }

  // Step 7b: Stamp official status from curated list
  const officialNames = new Set<string>();
  if (fs.existsSync(OFFICIAL_SERVERS_FILE)) {
    const officialData = JSON.parse(fs.readFileSync(OFFICIAL_SERVERS_FILE, "utf-8")) as {
      servers: string[];
    };
    for (const name of officialData.servers) {
      officialNames.add(name);
    }
    log(`Loaded ${officialNames.size} official server names.`);
  }

  for (const [name, entry] of baseData) {
    const _meta = (entry._meta ?? {}) as Record<string, unknown>;
    const enrichment = _meta["es.getmcp/enrichment"] as GetMCPEnrichmentType | undefined;
    if (enrichment) {
      const isOfficial = officialNames.has(name);
      if (isOfficial) {
        _meta["es.getmcp/enrichment"] = { ...enrichment, isOfficial: true };
      } else if (enrichment.isOfficial) {
        // Clear stale official flag
        const { isOfficial: _, ...rest } = enrichment;
        _meta["es.getmcp/enrichment"] = rest;
      }
      baseData.set(name, { server: entry.server, _meta });
    }
  }

  // Step 8: Assemble final sorted output
  const output = Array.from(baseData.values());

  output.sort((a, b) => {
    const slugA = (a._meta?.["es.getmcp/enrichment"] as GetMCPEnrichmentType)?.slug ?? "";
    const slugB = (b._meta?.["es.getmcp/enrichment"] as GetMCPEnrichmentType)?.slug ?? "";
    return slugA.localeCompare(slugB);
  });

  // Step 9: Write output
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  log(
    `Wrote ${OUTPUT_FILE} (${output.length} entries, ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB)`,
  );

  // Write metadata
  const metadata = {
    syncedAt: new Date().toISOString(),
    syncMode: isIncremental ? ("incremental" as const) : ("full" as const),
    totalEntries: output.length,
    updatedEntries: fetchedFiltered.size,
    removedEntries: inactiveNames.size,
    enrichedWithGitHub: enrichCount,
    withMetrics: metricsCount,
    sources: [source.name],
    duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
  };
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  log(`Wrote ${METADATA_FILE}`);

  log(`Done! ${output.length} servers synced in ${metadata.duration}.`);
}

main().catch((err) => {
  console.error("[sync] Fatal error:", err);
  process.exit(1);
});
