import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/constants";
import { chunkEntries, getSitemapEntries, latestDate, renderSitemapIndex } from "@/lib/sitemap";

export const GET: APIRoute = () => {
  const items = chunkEntries(getSitemapEntries()).map((chunk, i) => ({
    loc: `${SITE_URL}/sitemap-${i}.xml`,
    lastModified: latestDate(chunk.map((e) => e.lastModified)),
  }));
  return new Response(renderSitemapIndex(items), {
    headers: { "Content-Type": "application/xml" },
  });
};
