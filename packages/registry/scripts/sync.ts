/**
 * Sync pipeline: fetch from official MCP registry, enrich, and write data/servers.json.
 *
 * Usage: npx tsx packages/registry/scripts/sync.ts
 * Env:   GITHUB_TOKEN (required for GitHub enrichment)
 *        PULSEMCP_API_KEY (optional, for future PulseMCP source)
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

const OFFICIAL_API = "https://registry.modelcontextprotocol.io/v0.1/servers";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CONCURRENCY = 10;

// ---------------------------------------------------------------------------
// Registry source abstraction
// ---------------------------------------------------------------------------

interface RegistrySource {
  name: string;
  fetchAll(): AsyncGenerator<OfficialServerResponseType>;
}

class OfficialRegistrySource implements RegistrySource {
  name = "official";

  async *fetchAll(): AsyncGenerator<OfficialServerResponseType> {
    let cursor: string | undefined;
    let page = 0;

    while (true) {
      const url = new URL(OFFICIAL_API);
      url.searchParams.set("count", "100");
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
// Pipeline
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[sync] ${msg}`);
}

async function main(): Promise<void> {
  const startTime = Date.now();

  log("Starting sync pipeline...");
  if (!GITHUB_TOKEN) {
    log("WARNING: GITHUB_TOKEN not set. GitHub enrichment will be rate-limited.");
  }

  // Step 1: Fetch all entries
  const sources: RegistrySource[] = [new OfficialRegistrySource()];
  const rawEntries: OfficialServerResponseType[] = [];

  for (const source of sources) {
    log(`Fetching from ${source.name}...`);
    for await (const entry of source.fetchAll()) {
      rawEntries.push(entry);
    }
  }

  log(`Fetched ${rawEntries.length} total entries.`);

  // Step 2: Deduplicate by server name and filter
  const deduped = new Map<string, OfficialServerResponseType>();
  for (const entry of rawEntries) {
    const name = entry.server.name;
    const meta = entry._meta?.["io.modelcontextprotocol.registry/official"] as
      | { status?: string; isLatest?: boolean }
      | undefined;

    // Only keep active, latest entries
    if (meta?.status && meta.status !== "active") continue;
    if (meta?.isLatest === false) continue;

    // Skip entries with no installable config
    if (
      (!entry.server.packages || entry.server.packages.length === 0) &&
      (!entry.server.remotes || entry.server.remotes.length === 0)
    ) {
      continue;
    }

    deduped.set(name, entry);
  }

  log(`After dedup/filter: ${deduped.size} entries.`);

  // Step 3: Generate slug IDs
  const officialNames = Array.from(deduped.keys());
  const slugMap = generateSlugs(officialNames);

  log(`Generated ${slugMap.size} slugs.`);

  // Step 4: Enrich with GitHub data
  log("Enriching with GitHub data...");
  const entries = Array.from(deduped.entries());
  let enrichCount = 0;

  const enriched = await withConcurrency(entries, CONCURRENCY, async ([name, entry]) => {
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

  // Step 5: Fetch metrics
  log("Fetching metrics...");
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

  // Step 6: Assemble final output
  const output: OfficialServerResponseType[] = withMetrics.map(({ entry, enrichment, metrics }) => {
    const _meta: Record<string, unknown> = { ...(entry._meta ?? {}) };

    // Add getmcp enrichment
    _meta["es.getmcp/enrichment"] = enrichment;

    // Add metrics if available
    if (metrics) {
      _meta["es.getmcp/metrics"] = {
        ...metrics,
        fetchedAt: new Date().toISOString(),
      };
    }

    return {
      server: entry.server,
      _meta,
    };
  });

  // Sort by slug for stable diffs
  output.sort((a, b) => {
    const slugA = (a._meta?.["es.getmcp/enrichment"] as GetMCPEnrichmentType)?.slug ?? "";
    const slugB = (b._meta?.["es.getmcp/enrichment"] as GetMCPEnrichmentType)?.slug ?? "";
    return slugA.localeCompare(slugB);
  });

  // Step 7: Write output
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
    totalEntries: output.length,
    enrichedWithGitHub: enrichCount,
    withMetrics: metricsCount,
    sources: sources.map((s) => s.name),
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
