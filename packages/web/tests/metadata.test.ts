import { describe, it, expect } from "vitest";
import { resolveMetadata, ROOT_METADATA, absoluteUrl } from "@/lib/metadata";

describe("resolveMetadata", () => {
  it("applies the title template to non-root pages", () => {
    expect(resolveMetadata({ title: "Docs" }).title).toBe("Docs — getmcp");
  });

  it("keeps the root page title as-is", () => {
    expect(resolveMetadata({ title: "Home" }, { isRootPage: true }).title).toBe("Home");
  });

  it("falls back to the default title", () => {
    expect(resolveMetadata({}).title).toBe(
      "getmcp — Install MCP Servers in 19 AI Apps with One Command",
    );
  });

  it("merges page keys shallowly over the root metadata, like Next.js", () => {
    const resolved = resolveMetadata({ openGraph: { title: "Page", type: "website" } });
    // A page `openGraph` replaces the root one entirely.
    expect(resolved.openGraph).toEqual({ title: "Page", type: "website" });
    // Keys the page does not set are inherited.
    expect(resolved.keywords).toEqual(ROOT_METADATA.keywords);
    expect(resolved.alternates).toEqual(ROOT_METADATA.alternates);
  });

  it("fills missing Twitter title and description from Open Graph", () => {
    const resolved = resolveMetadata({ openGraph: { title: "OG", description: "Desc" } });
    expect(resolved.twitter).toMatchObject({
      card: "summary_large_image",
      site: "@getmcp",
      title: "OG",
      description: "Desc",
    });
  });

  it("passes OG image and noindex options through", () => {
    const resolved = resolveMetadata(
      {},
      { noindex: true, ogImage: { path: "/opengraph-image.png", alt: "alt" } },
    );
    expect(resolved.noindex).toBe(true);
    expect(resolved.ogImage).toEqual({ path: "/opengraph-image.png", alt: "alt" });
  });
});

describe("absoluteUrl", () => {
  it("resolves paths against the site URL", () => {
    expect(absoluteUrl("/servers")).toBe("https://getmcp.es/servers");
  });
});
