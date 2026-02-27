import { describe, it, expect } from "vitest";
import {
  getServer,
  getServerOrThrow,
  getServerIds,
  getAllServers,
  searchServers,
  getServersByCategory,
  getCategories,
  getServerCount,
  getServerMetrics,
  getServerByOfficialName,
  findServerByCommand,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Basic loading
// ---------------------------------------------------------------------------

describe("registry loads from data/servers.json", () => {
  it("loads a non-zero number of servers", () => {
    expect(getServerCount()).toBeGreaterThan(100);
  });

  it("all entries have required fields", () => {
    for (const server of getAllServers()) {
      expect(server.id).toBeTruthy();
      expect(server.name).toBeTruthy();
      expect(server.description).toBeTruthy();
      expect(server.config).toBeDefined();
      expect(server.officialName).toBeTruthy();
    }
  });

  it("all entries have unique IDs", () => {
    const ids = getAllServers().map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

describe("getServer", () => {
  it("returns a server by slug ID", () => {
    const servers = getAllServers();
    if (servers.length > 0) {
      const first = servers[0];
      const result = getServer(first.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(first.id);
    }
  });

  it("returns undefined for unknown ID", () => {
    expect(getServer("nonexistent-server-xyz")).toBeUndefined();
  });
});

describe("getServerOrThrow", () => {
  it("returns a server by slug ID", () => {
    const servers = getAllServers();
    if (servers.length > 0) {
      const first = servers[0];
      const result = getServerOrThrow(first.id);
      expect(result.id).toBe(first.id);
    }
  });

  it("throws for unknown ID with helpful message", () => {
    expect(() => getServerOrThrow("nonexistent-server-xyz")).toThrow(/not found in registry/);
    expect(() => getServerOrThrow("nonexistent-server-xyz")).toThrow(/Available:/);
  });
});

describe("getServerByOfficialName", () => {
  it("looks up server by reverse-DNS name", () => {
    const servers = getAllServers();
    if (servers.length > 0) {
      const first = servers[0];
      const result = getServerByOfficialName(first.officialName);
      expect(result).toBeDefined();
      expect(result!.id).toBe(first.id);
    }
  });

  it("returns undefined for unknown name", () => {
    expect(getServerByOfficialName("io.unknown/nonexistent")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Listing functions
// ---------------------------------------------------------------------------

describe("getServerIds", () => {
  it("returns all IDs sorted alphabetically", () => {
    const ids = getServerIds();
    expect(ids.length).toBeGreaterThan(100);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });
});

describe("getAllServers", () => {
  it("returns all server entries sorted by ID", () => {
    const servers = getAllServers();
    expect(servers.length).toBeGreaterThan(100);
    const ids = servers.map((s) => s.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });
});

describe("getServerCount", () => {
  it("returns the correct count", () => {
    expect(getServerCount()).toBe(getAllServers().length);
  });
});

// ---------------------------------------------------------------------------
// Search functions
// ---------------------------------------------------------------------------

describe("searchServers", () => {
  it("returns all servers for empty query", () => {
    expect(searchServers("").length).toBe(getServerCount());
    expect(searchServers("  ").length).toBe(getServerCount());
  });

  it("finds servers by name keyword", () => {
    const results = searchServers("github");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("is case-insensitive", () => {
    const upper = searchServers("GITHUB");
    const lower = searchServers("github");
    expect(upper.length).toBe(lower.length);
  });

  it("returns empty for no match", () => {
    const results = searchServers("xyznonexistentzzz");
    expect(results.length).toBe(0);
  });
});

describe("getServersByCategory", () => {
  it("finds servers by category", () => {
    const categories = getCategories();
    if (categories.length > 0) {
      const results = getServersByCategory(categories[0]);
      expect(results.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("is case-insensitive", () => {
    const categories = getCategories();
    if (categories.length > 0) {
      const lower = getServersByCategory(categories[0]);
      const upper = getServersByCategory(categories[0].toUpperCase());
      expect(lower.length).toBe(upper.length);
    }
  });

  it("returns empty for unknown category", () => {
    expect(getServersByCategory("nonexistent-category").length).toBe(0);
  });
});

describe("getCategories", () => {
  it("returns unique categories sorted", () => {
    const categories = getCategories();
    // Categories may be empty if GitHub enrichment hasn't run (no GITHUB_TOKEN).
    // Just verify the array is sorted and unique.
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });
});

// ---------------------------------------------------------------------------
// Server content checks
// ---------------------------------------------------------------------------

describe("server content integrity", () => {
  it("stdio servers have command field", () => {
    const stdioServers = getAllServers().filter((s) => "command" in s.config);
    expect(stdioServers.length).toBeGreaterThan(0);
    for (const server of stdioServers) {
      const config = server.config as { command: string };
      expect(config.command.length).toBeGreaterThan(0);
    }
  });

  it("remote servers have url field", () => {
    const remoteServers = getAllServers().filter((s) => "url" in s.config);
    for (const server of remoteServers) {
      const config = server.config as { url: string };
      expect(config.url).toMatch(/^https?:\/\//);
    }
  });
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

describe("getServerMetrics", () => {
  it("returns metrics for servers that have them", () => {
    const servers = getAllServers();
    let foundMetrics = false;
    for (const server of servers.slice(0, 50)) {
      const metrics = getServerMetrics(server.id);
      if (metrics) {
        foundMetrics = true;
        expect(metrics.fetchedAt).toBeTruthy();
        break;
      }
    }
    // At least some servers should have metrics from the sync
    expect(foundMetrics).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// findServerByCommand
// ---------------------------------------------------------------------------

describe("findServerByCommand", () => {
  it("finds a server by package name in args", () => {
    const servers = getAllServers().filter((s) => s.package && "command" in s.config);
    if (servers.length > 0) {
      const server = servers[0];
      const config = server.config as { command: string; args: string[] };
      const result = findServerByCommand(config.command, config.args);
      expect(result).toBeDefined();
    }
  });

  it("returns undefined for unknown command", () => {
    expect(findServerByCommand("nonexistent-cmd", ["arg1"])).toBeUndefined();
  });
});
