import { describe, it, expect } from "vitest";
import { getAllServers, getCategories } from "@getmcp/registry";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import {
  chunkEntries,
  getSitemapEntries,
  renderSitemapIndex,
  renderUrlSet,
  SITEMAP_CHUNK_SIZE,
} from "@/lib/sitemap";

describe("sitemap", () => {
  const entries = getSitemapEntries();
  const urls = entries.map((e) => e.url);

  it("lists every static route, category, guide and server slug once", () => {
    const slugs = new Set(getAllServers().map((s) => s.slug));
    expect(urls).toContain("https://getmcp.es");
    expect(urls).toContain("https://getmcp.es/servers");
    expect(urls).toContain("https://getmcp.es/docs");
    expect(urls).toContain("https://getmcp.es/guides");
    for (const cat of getCategories()) expect(urls).toContain(`https://getmcp.es/category/${cat}`);
    for (const app of GUIDE_SLUGS) expect(urls).toContain(`https://getmcp.es/guides/${app}`);
    expect(urls.filter((u) => u.includes("/servers/")).length).toBe(slugs.size);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("splits entries into chunks below the protocol limit", () => {
    const chunks = chunkEntries(entries);
    expect(chunks.flat()).toEqual(entries);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(SITEMAP_CHUNK_SIZE);
    expect(chunkEntries([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("renders escaped XML", () => {
    const xml = renderUrlSet(
      [{ url: "https://getmcp.es/a?b=1&c=<2>", changeFrequency: "monthly", priority: 0.8 }],
      "2026-01-01T00:00:00.000Z",
    );
    expect(xml).toContain("<loc>https://getmcp.es/a?b=1&amp;c=&lt;2&gt;</loc>");
    expect(xml).toContain("<lastmod>2026-01-01T00:00:00.000Z</lastmod>");
    expect(xml).toContain("<changefreq>monthly</changefreq>");

    const index = renderSitemapIndex(["https://getmcp.es/sitemap-0.xml"], "2026-01-01");
    expect(index).toContain("<sitemapindex");
    expect(index).toContain("<loc>https://getmcp.es/sitemap-0.xml</loc>");
  });
});
