/**
 * Registry cache fetch — paginated API fetching and entry merging.
 *
 * Fetches MCP server entries from registry APIs with cursor-based pagination,
 * and merges incremental updates into existing cached data.
 */

import type { RegistryEntryType } from "@getmcp/core";
import type { RegistrySourceType } from "./registry-config.js";
import { buildAuthHeaders } from "./credentials.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 30-second timeout per API request */
const DOWNLOAD_TIMEOUT_MS = 30_000;

/** Number of servers to request per page */
const PAGE_LIMIT = 100;

/** Maximum pages to follow before stopping (safety limit) */
const MAX_PAGES = 1_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiServerListResponse {
  servers: RegistryEntryType[];
  metadata: { nextCursor?: string; count: number };
}

// ---------------------------------------------------------------------------
// API fetch
// ---------------------------------------------------------------------------

/**
 * Fetch all servers from a registry API, following pagination cursors.
 * Optionally limits to entries updated after `updatedSince` (ISO timestamp).
 *
 * Stops after MAX_PAGES to guard against infinite pagination from a
 * malicious or misconfigured registry.
 */
export async function fetchFromRegistryAPI(
  registry: RegistrySourceType,
  updatedSince?: string,
): Promise<RegistryEntryType[]> {
  const authHeaders = buildAuthHeaders(registry.name);
  const results: RegistryEntryType[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const url = new URL(`${registry.url}/v0.1/servers`);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("version", "latest");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    if (updatedSince) {
      url.searchParams.set("updated_since", updatedSince);
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", ...authHeaders },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url.toString()}`);
    }

    const body = (await response.json()) as ApiServerListResponse;
    results.push(...body.servers);
    cursor = body.metadata.nextCursor;
    pages++;

    if (pages >= MAX_PAGES) {
      console.warn(
        `Warning: registry "${registry.name}" exceeded ${MAX_PAGES} pages — stopping pagination.`,
      );
      break;
    }
  } while (cursor);

  return results;
}

// ---------------------------------------------------------------------------
// Entry merging
// ---------------------------------------------------------------------------

/**
 * Merge incremental updates into an existing list of server entries.
 * Uses `server.name` (stable reverse-DNS name) as the identity key.
 * Updated entries replace existing ones; new entries are appended.
 */
export function mergeEntries(
  existing: RegistryEntryType[],
  updates: RegistryEntryType[],
): RegistryEntryType[] {
  const byName = new Map<string, RegistryEntryType>();

  for (const entry of existing) {
    byName.set(entry.server.name, entry);
  }
  for (const entry of updates) {
    byName.set(entry.server.name, entry);
  }

  return Array.from(byName.values());
}
