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
  it("extracts org from reverse-DNS name", () => {
    expect(extractOrg("io.github.getsentry/sentry-mcp")).toBe("getsentry");
  });

  it("extracts org from deep namespace", () => {
    expect(extractOrg("io.github.modelcontextprotocol/test")).toBe("modelcontextprotocol");
  });

  it("returns empty for single-segment name", () => {
    expect(extractOrg("simple")).toBe("");
  });
});

describe("resolveCollisions", () => {
  it("returns slugs unchanged when no collisions", () => {
    const entries = [
      { officialName: "io.github.a/server-a", slug: "server-a" },
      { officialName: "io.github.b/server-b", slug: "server-b" },
    ];
    const result = resolveCollisions(entries);
    expect(result.get("io.github.a/server-a")).toBe("server-a");
    expect(result.get("io.github.b/server-b")).toBe("server-b");
  });

  it("prefixes with org on collision", () => {
    const entries = [
      { officialName: "io.github.alice/brave", slug: "brave" },
      { officialName: "io.github.bob/brave", slug: "brave" },
    ];
    const result = resolveCollisions(entries);
    expect(result.get("io.github.alice/brave")).toBe("alice-brave");
    expect(result.get("io.github.bob/brave")).toBe("bob-brave");
  });
});

describe("generateSlugs", () => {
  it("generates unique slugs for a list", () => {
    const names = ["io.github.a/sentry-mcp", "io.github.b/redis-server", "io.github.c/postgres"];
    const result = generateSlugs(names);
    expect(result.size).toBe(3);
    const slugs = Array.from(result.values());
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("resolves collisions automatically", () => {
    const names = ["io.github.alice/test-mcp", "io.github.bob/test-mcp"];
    const result = generateSlugs(names);
    const slugs = Array.from(result.values());
    expect(new Set(slugs).size).toBe(2); // All unique
  });
});
