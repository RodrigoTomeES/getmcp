import { getAllServers, getCategories } from "@getmcp/registry";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import { SITE_URL } from "@/lib/constants";

/** Max URLs per sitemap file (the protocol limit is 50,000). */
export const SITEMAP_CHUNK_SIZE = 10_000;

export type SitemapEntry = {
  url: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
};

/** Same URL list (and order) as the previous Next.js `sitemap.ts`. */
export function getSitemapEntries(): SitemapEntry[] {
  const serverSlugs = new Set(getAllServers().map((server) => server.slug));

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/docs`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/servers`, changeFrequency: "weekly", priority: 0.95 },
    ...getCategories().map((cat) => ({
      url: `${SITE_URL}/category/${cat}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    { url: `${SITE_URL}/guides`, changeFrequency: "monthly", priority: 0.9 },
    ...GUIDE_SLUGS.map((app) => ({
      url: `${SITE_URL}/guides/${app}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...Array.from(serverSlugs, (slug) => ({
      url: `${SITE_URL}/servers/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
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

export function renderUrlSet(entries: SitemapEntry[], lastModified: string): string {
  const urls = entries
    .map(
      (e) =>
        `<url>\n<loc>${escapeXml(e.url)}</loc>\n<lastmod>${lastModified}</lastmod>\n<changefreq>${e.changeFrequency}</changefreq>\n<priority>${e.priority}</priority>\n</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapIndex(locations: string[], lastModified: string): string {
  const items = locations
    .map(
      (loc) =>
        `<sitemap>\n<loc>${escapeXml(loc)}</loc>\n<lastmod>${lastModified}</lastmod>\n</sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

/** Shared build timestamp so every sitemap file reports the same `lastmod`. */
export const BUILD_DATE = new Date().toISOString();
