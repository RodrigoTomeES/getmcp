import { getOfficialServers, getServerBySlug, getServerMetrics } from "@getmcp/registry";
import type { InternalRegistryEntry } from "@getmcp/registry";

export const POPULAR_SERVERS_LIMIT = 6;

/**
 * Top official servers by GitHub stars. Skips entries whose slug page shows
 * another server (several entries can share a slug).
 */
export function getPopularOfficialServers(
  limit: number = POPULAR_SERVERS_LIMIT,
): InternalRegistryEntry[] {
  return getOfficialServers()
    .toSorted((a, b) => {
      const sa = getServerMetrics(a.id)?.github?.stars ?? 0;
      const sb = getServerMetrics(b.id)?.github?.stars ?? 0;
      return sb - sa;
    })
    .filter((s) => getServerBySlug(s.slug)?.id === s.id)
    .slice(0, limit);
}
