import {
  getAllServers,
  getRawServerData,
  getServerMetrics,
  getServersByCategory,
} from "@getmcp/registry";
import type { InternalRegistryEntry } from "@getmcp/registry";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import { SITE_URL } from "@/lib/constants";
import { getServerPaths } from "@/lib/server-paths";

/** Max URLs per sitemap file (the protocol limit is 50,000). */
export const SITEMAP_CHUNK_SIZE = 10_000;

export type SitemapEntry = {
  url: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
  /** ISO 8601 date; `<lastmod>` is omitted when unset. */
  lastModified?: string;
};

/** `_meta` key the official MCP registry uses for its own bookkeeping. */
const OFFICIAL_META_KEY = "io.modelcontextprotocol.registry/official";

/** Newest valid date as an ISO string, or `undefined` when there is none. */
export function latestDate(dates: Iterable<string | undefined>): string | undefined {
  let max = Number.NEGATIVE_INFINITY;
  for (const date of dates) {
    if (date === undefined) continue;
    const time = Date.parse(date);
    if (time > max) max = time;
  }
  return Number.isFinite(max) ? new Date(max).toISOString() : undefined;
}

/**
 * Last real change of a server: the newer of the registry `updatedAt` and the
 * last GitHub push (the "Updated" date shown on the server page). Volatile
 * counters (stars, downloads) are ignored on purpose.
 */
export function serverLastModified(server: InternalRegistryEntry): string | undefined {
  const officialMeta = getRawServerData(server.id)?._meta?.[OFFICIAL_META_KEY];
  const updatedAt =
    officialMeta && typeof officialMeta === "object" && "updatedAt" in officialMeta
      ? officialMeta.updatedAt
      : undefined;
  return latestDate([
    typeof updatedAt === "string" ? updatedAt : undefined,
    getServerMetrics(server.id)?.github?.lastPush,
  ]);
}

/**
 * Same URL list (and order) as the previous Next.js `sitemap.ts`. Listing pages
 * use the newest date of their servers; docs and guides omit `lastModified`.
 * Paginated category pages (2+) are not listed.
 */
export function getSitemapEntries(): SitemapEntry[] {
  const dates = new Map(getAllServers().map((s) => [s.id, serverLastModified(s)]));
  const siteDate = latestDate(dates.values());

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1, lastModified: siteDate },
    { url: `${SITE_URL}/docs`, changeFrequency: "monthly", priority: 0.9 },
    {
      url: `${SITE_URL}/servers`,
      changeFrequency: "weekly",
      priority: 0.95,
      lastModified: siteDate,
    },
    ...[...CATEGORY_SLUGS].sort().map((cat) => ({
      url: `${SITE_URL}/category/${cat}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
      lastModified: latestDate(getServersByCategory(cat).map((s) => dates.get(s.id))),
    })),
    { url: `${SITE_URL}/guides`, changeFrequency: "monthly", priority: 0.9 },
    ...GUIDE_SLUGS.map((app) => ({
      url: `${SITE_URL}/guides/${app}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...getServerPaths().map(({ params, props }) => ({
      url: `${SITE_URL}/servers/${params.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified: dates.get(props.server.id),
    })),
  ];
}

export function chunkEntries<T>(entries: T[], size = SITEMAP_CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < entries.length; i += size) chunks.push(entries.slice(i, i + size));
  return chunks;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function lastmodTag(lastModified: string | undefined): string {
  return lastModified ? `\n<lastmod>${escapeXml(lastModified)}</lastmod>` : "";
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `<url>\n<loc>${escapeXml(e.url)}</loc>${lastmodTag(e.lastModified)}\n<changefreq>${e.changeFrequency}</changefreq>\n<priority>${e.priority}</priority>\n</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapIndex(items: { loc: string; lastModified?: string }[]): string {
  const sitemaps = items
    .map(
      (item) =>
        `<sitemap>\n<loc>${escapeXml(item.loc)}</loc>${lastmodTag(item.lastModified)}\n</sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}
