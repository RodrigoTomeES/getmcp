import { getOfficialServers, getServerMetrics } from "@getmcp/registry";
import type { InternalRegistryEntry } from "@getmcp/registry";

export const POPULAR_SERVERS_LIMIT = 6;

export function getPopularOfficialServers(
  limit: number = POPULAR_SERVERS_LIMIT,
): InternalRegistryEntry[] {
  return getOfficialServers()
    .toSorted((a, b) => {
      const sa = getServerMetrics(a.id)?.github?.stars ?? 0;
      const sb = getServerMetrics(b.id)?.github?.stars ?? 0;
      return sb - sa;
    })
    .slice(0, limit);
}
