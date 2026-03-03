import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
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
  getOfficialServers,
  findServerByCommand,
  resetRegistry,
  loadFromPath,
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
// Official servers
// ---------------------------------------------------------------------------

describe("getOfficialServers", () => {
  it("returns only servers with isOfficial === true", () => {
    const officials = getOfficialServers();
    for (const server of officials) {
      expect(server.isOfficial).toBe(true);
    }
  });

  it("is a subset of getAllServers", () => {
    const officials = getOfficialServers();
    const allIds = new Set(getAllServers().map((s) => s.id));
    for (const server of officials) {
      expect(allIds.has(server.id)).toBe(true);
    }
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

// ---------------------------------------------------------------------------
// resetRegistry / loadFromPath
// ---------------------------------------------------------------------------

describe("resetRegistry", () => {
  it("clears registry and re-triggers load from bundled on next access", () => {
    // Ensure registry is loaded first
    const countBefore = getServerCount();
    expect(countBefore).toBeGreaterThan(0);

    resetRegistry();

    // Next access should re-trigger loadServers() from bundled data
    const countAfter = getServerCount();
    expect(countAfter).toBe(countBefore);
  });
});

describe("loadFromPath", () => {
  it("loads data from a custom file path", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-test-"));
    const tmpFile = path.join(tmpDir, "servers.json");

    // Write a minimal servers.json with one entry matching official registry schema
    const minimalEntry = [
      {
        server: {
          name: "io.test/test-server",
          description: "A test server",
          packages: [
            {
              registryType: "npm",
              identifier: "test-server",
            },
          ],
        },
        _meta: { "es.getmcp/enrichment": { slug: "test-server" } },
      },
    ];
    fs.writeFileSync(tmpFile, JSON.stringify(minimalEntry), "utf-8");

    loadFromPath(tmpFile);

    expect(getServerCount()).toBe(1);
    expect(getServer("test-server")).toBeDefined();

    // Clean up: restore bundled data for other tests
    resetRegistry();

    fs.rmSync(tmpDir, { recursive: true });
  });

  it("results in empty registry when file does not exist", () => {
    loadFromPath("/nonexistent/path/servers.json");

    expect(getServerCount()).toBe(0);
    expect(getAllServers()).toEqual([]);

    // Clean up: restore bundled data for other tests
    resetRegistry();
  });

  it("does not fall back to bundled data after loading", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-test-"));
    const tmpFile = path.join(tmpDir, "servers.json");

    // Write an empty array
    fs.writeFileSync(tmpFile, "[]", "utf-8");

    loadFromPath(tmpFile);

    // Should have 0 servers, NOT fall back to bundled
    expect(getServerCount()).toBe(0);

    // Clean up: restore bundled data for other tests
    resetRegistry();

    fs.rmSync(tmpDir, { recursive: true });
  });
});
