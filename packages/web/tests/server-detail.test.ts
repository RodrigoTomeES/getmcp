import { describe, it, expect } from "vitest";
import { getAllServers } from "@getmcp/registry";
import { generators } from "@getmcp/generators";
import {
  getRelatedServers,
  preGenerateConfigs,
  runtimeToRequirements,
  toServerCardData,
} from "@/lib/server-detail";
import { getServerPaths } from "@/lib/server-paths";

describe("server detail helpers", () => {
  const servers = getAllServers();

  it("matches the previous related-servers query", () => {
    const sample = servers.filter((s) => s.categories?.length).slice(0, 50);
    for (const server of sample) {
      const primary = server.categories[0];
      const expected = servers
        .filter((s) => s.id !== server.id && s.categories?.includes(primary))
        .slice(0, 4)
        .map(toServerCardData);
      expect(getRelatedServers(server)).toEqual(expected);
    }
  });

  it("returns no related servers without a category", () => {
    const server = servers.find((s) => !s.categories?.length);
    if (server) expect(getRelatedServers(server)).toEqual([]);
  });

  it("pre-generates a config for every app", () => {
    const configs = preGenerateConfigs(servers[0].id, servers[0].config);
    expect(Object.keys(configs).sort()).toEqual(Object.keys(generators).sort());
    for (const config of Object.values(configs)) {
      expect(config.serialized.length).toBeGreaterThan(0);
      expect(config.format).toMatch(/^[A-Z]+$/);
    }
  });

  it("maps runtimes to requirements", () => {
    expect(runtimeToRequirements("python")).toBe("Python 3.10+");
    expect(runtimeToRequirements(undefined)).toBe("Node.js 18+");
    expect(runtimeToRequirements("deno")).toBe("deno");
  });

  it("emits one static path per unique slug", () => {
    const paths = getServerPaths();
    const slugs = new Set(servers.map((s) => s.slug));
    expect(paths.length).toBe(slugs.size);
    for (const { params, props } of paths.slice(0, 100)) {
      expect(props.server.slug).toBe(params.id);
    }
  });
});
