import { describe, it, expect } from "vitest";
import { generators } from "@getmcp/generators";
import type { AppIdType } from "@getmcp/core";
import { getServerBySlug } from "@getmcp/registry";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import { getPopularOfficialServers, POPULAR_SERVERS_LIMIT } from "@/lib/popular-servers";

describe("guides popular servers", () => {
  const popular = getPopularOfficialServers();

  it("returns at most the limit, each linking to its own server page", () => {
    expect(popular.length).toBeLessThanOrEqual(POPULAR_SERVERS_LIMIT);
    for (const server of popular) {
      expect(getServerBySlug(server.slug)?.id).toBe(server.id);
    }
  });

  it("generates a non-empty example config for every guide", () => {
    const sample = popular[0];
    for (const app of GUIDE_SLUGS) {
      const gen = generators[app as AppIdType];
      expect(gen, `generator for ${app}`).toBeDefined();
      if (!sample) continue;
      const config = gen.serialize(gen.generate(sample.id, sample.config));
      expect(config.trim().length, `config for ${app}`).toBeGreaterThan(0);
    }
  });
});
