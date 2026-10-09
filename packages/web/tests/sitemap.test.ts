import { describe, it, expect } from "vitest";
import { getAllServers } from "@getmcp/registry";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import {
  chunkEntries,
  getSitemapEntries,
  latestDate,
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
    for (const cat of CATEGORY_SLUGS) expect(urls).toContain(`https://getmcp.es/category/${cat}`);
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
    const xml = renderUrlSet([
      {
        url: "https://getmcp.es/a?b=1&c=<2>",
        changeFrequency: "monthly",
        priority: 0.8,
        lastModified: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(xml).toContain("<loc>https://getmcp.es/a?b=1&amp;c=&lt;2&gt;</loc>");
    expect(xml).toContain("<lastmod>2026-01-01T00:00:00.000Z</lastmod>");
    expect(xml).toContain("<changefreq>monthly</changefreq>");

    const index = renderSitemapIndex([
      { loc: "https://getmcp.es/sitemap-0.xml", lastModified: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(index).toContain("<sitemapindex");
    expect(index).toContain("<loc>https://getmcp.es/sitemap-0.xml</loc>");
    expect(index).toContain("<lastmod>2026-01-01T00:00:00.000Z</lastmod>");
  });

  it("emits <lastmod> only when an entry has a date", () => {
    const xml = renderUrlSet([
      { url: "https://getmcp.es/a", changeFrequency: "monthly", priority: 0.8 },
      {
        url: "https://getmcp.es/b",
        changeFrequency: "monthly",
        priority: 0.8,
        lastModified: "2026-02-03T04:05:06.000Z",
      },
    ]);
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).toContain(
      "<loc>https://getmcp.es/b</loc>\n<lastmod>2026-02-03T04:05:06.000Z</lastmod>",
    );
    expect(xml).toContain("<loc>https://getmcp.es/a</loc>\n<changefreq>");

    const index = renderSitemapIndex([{ loc: "https://getmcp.es/sitemap-0.xml" }]);
    expect(index).not.toContain("<lastmod>");
  });

  it("latestDate picks the newest valid date", () => {
    expect(latestDate(["2026-01-01T00:00:00Z", undefined, "not a date", "2026-03-01"])).toBe(
      "2026-03-01T00:00:00.000Z",
    );
    expect(latestDate(["2026-10-08T11:29:07.276109Z"])).toBe("2026-10-08T11:29:07.276Z");
    expect(latestDate([])).toBeUndefined();
    expect(latestDate([undefined, "nope"])).toBeUndefined();
  });

  it("uses real per-page dates", () => {
    const byUrl = new Map(entries.map((e) => [e.url, e]));
    const undated = [
      "https://getmcp.es/docs",
      "https://getmcp.es/guides",
      ...GUIDE_SLUGS.map((app) => `https://getmcp.es/guides/${app}`),
    ];
    for (const url of undated) {
      expect(byUrl.has(url)).toBe(true);
      expect(byUrl.get(url)?.lastModified).toBeUndefined();
    }

    const home = byUrl.get("https://getmcp.es")?.lastModified;
    expect(home).toBeDefined();
    expect(byUrl.get("https://getmcp.es/servers")?.lastModified).toBe(home);
    for (const e of entries) {
      if (e.lastModified) expect(Date.parse(e.lastModified)).toBeLessThanOrEqual(Date.parse(home!));
    }

    expect(byUrl.get("https://getmcp.es/servers/github-github")?.lastModified).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
  });
});
