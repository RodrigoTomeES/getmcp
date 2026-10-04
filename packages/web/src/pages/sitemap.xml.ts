import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/constants";
import { BUILD_DATE, chunkEntries, getSitemapEntries, renderSitemapIndex } from "@/lib/sitemap";

export const GET: APIRoute = () => {
  const chunks = chunkEntries(getSitemapEntries());
  const locations = chunks.map((_, i) => `${SITE_URL}/sitemap-${i}.xml`);
  return new Response(renderSitemapIndex(locations, BUILD_DATE), {
    headers: { "Content-Type": "application/xml" },
  });
};
