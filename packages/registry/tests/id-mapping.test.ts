import { describe, it, expect } from "vitest";
import { generateSlug, extractOrg, resolveCollisions, generateSlugs } from "../src/id-mapping.js";

describe("generateSlug", () => {
  it("extracts last segment after /", () => {
    expect(generateSlug("io.github.getsentry/sentry-mcp")).toBe("sentry");
  });

  it("strips -mcp-server suffix", () => {
    expect(generateSlug("io.github.test/example-mcp-server")).toBe("example");
  });

  it("strips -mcp suffix", () => {
    expect(generateSlug("io.github.test/example-mcp")).toBe("example");
  });

  it("strips -server suffix", () => {
    expect(generateSlug("io.github.test/example-server")).toBe("example");
  });

  it("keeps short names without suffixes", () => {
    expect(generateSlug("io.github.test/redis")).toBe("redis");
  });

  it("sanitizes non-alphanumeric characters", () => {
    expect(generateSlug("io.github.test/My_Server.v2")).toBe("my-server-v2");
  });

  it("handles single segment names", () => {
    expect(generateSlug("simple-server")).toBe("simple");
  });

  it("does not strip suffix if it would result in empty string", () => {
    expect(generateSlug("io.github.test/mcp")).toBe("mcp");
  });
});

describe("extractOrg", () => {
  it("extracts last DNS segment for normal names", () => {
    expect(extractOrg("io.github.getsentry/sentry-mcp")).toBe("getsentry");
  });

  it("skips DNS segments matching the repo name", () => {
    expect(extractOrg("com.cloudflare.mcp/mcp")).toBe("cloudflare");
  });

  it("extracts correct org for figma mcp", () => {
    expect(extractOrg("com.figma.mcp/mcp")).toBe("figma");
  });

  it("extracts correct org for paypal mcp", () => {
    expect(extractOrg("com.paypal.mcp/mcp")).toBe("paypal");
  });

  it("extracts correct org for stackoverflow mcp", () => {
    expect(extractOrg("com.stackoverflow.mcp/mcp")).toBe("stackoverflow");
  });

  it("extracts correct org for scrapfly mcp", () => {
    expect(extractOrg("io.scrapfly.mcp/mcp")).toBe("scrapfly");
  });

  it("returns empty string for names without /", () => {
    expect(extractOrg("simple-name")).toBe("");
  });

  it("falls back to last segment if all segments match repo name", () => {
    expect(extractOrg("mcp.mcp/mcp")).toBe("mcp");
  });
});

describe("resolveCollisions", () => {
  it("produces unique slugs for */mcp servers", () => {
    const colliders = [
      "com.cloudflare.mcp/mcp",
      "com.figma.mcp/mcp",
      "com.paypal.mcp/mcp",
      "com.stackoverflow.mcp/mcp",
      "io.scrapfly.mcp/mcp",
    ];

    const entries = colliders.map((name) => ({
      officialName: name,
      slug: generateSlug(name),
    }));

    const resolved = resolveCollisions(entries);
    const slugs = [...resolved.values()];

    // All slugs must be unique
    expect(new Set(slugs).size).toBe(slugs.length);

    // Each should be prefixed with the correct org
    expect(resolved.get("com.cloudflare.mcp/mcp")).toBe("cloudflare-mcp");
    expect(resolved.get("com.figma.mcp/mcp")).toBe("figma-mcp");
    expect(resolved.get("com.paypal.mcp/mcp")).toBe("paypal-mcp");
    expect(resolved.get("com.stackoverflow.mcp/mcp")).toBe("stackoverflow-mcp");
    expect(resolved.get("io.scrapfly.mcp/mcp")).toBe("scrapfly-mcp");
  });
});

describe("generateSlugs", () => {
  it("resolves collisions for */mcp servers end-to-end", () => {
    const names = ["com.cloudflare.mcp/mcp", "com.figma.mcp/mcp", "io.github.getsentry/sentry-mcp"];

    const slugs = generateSlugs(names);

    expect(slugs.get("com.cloudflare.mcp/mcp")).toBe("cloudflare-mcp");
    expect(slugs.get("com.figma.mcp/mcp")).toBe("figma-mcp");
    expect(slugs.get("io.github.getsentry/sentry-mcp")).toBe("sentry");
  });
});
