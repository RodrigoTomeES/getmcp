import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { RegistryEntryType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

vi.mock("@getmcp/registry", () => ({
  loadFromPath: vi.fn(),
  loadFromEntries: vi.fn(),
  generateSlug: vi.fn((name: string) =>
    name
      .split("/")
      .pop()!
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-"),
  ),
  transformToInternal: vi.fn(),
  extractServerConfig: vi.fn(),
}));

vi.mock("../src/registry-config.js", () => ({
  getAllRegistries: vi.fn(),
}));

vi.mock("../src/credentials.js", () => ({
  buildAuthHeaders: vi.fn(() => ({})),
}));

import {
  loadFromEntries,
  generateSlug,
  transformToInternal,
  extractServerConfig,
} from "@getmcp/registry";
import { getAllRegistries } from "../src/registry-config.js";
import { buildAuthHeaders } from "../src/credentials.js";
import {
  getRegistryCacheDir,
  initRegistryCache,
  refreshRegistryCache,
  clearRegistryCache,
  initProjectRegistries,
  cleanOrphanedCaches,
  fetchFromRegistryAPI,
} from "../src/registry-cache.js";

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

type RegistrySource = {
  name: string;
  url: string;
  type: "public" | "private";
  priority: number;
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OFFICIAL_REGISTRY: RegistrySource = {
  name: "official",
  url: "https://registry.modelcontextprotocol.io",
  type: "public",
  priority: 0,
};

const COMPANY_REGISTRY: RegistrySource = {
  name: "company",
  url: "https://mcp.company.internal",
  type: "private",
  priority: 50,
};

function makeServer(name: string): RegistryEntryType {
  return {
    server: {
      name,
      description: `Description for ${name}`,
      packages: [
        {
          registryType: "npm",
          identifier: `@scope/${name.split("/").pop() ?? name}`,
          transport: { type: "stdio" },
        },
      ],
    },
    _meta: {},
  };
}

function makeApiResponse(servers: RegistryEntryType[], nextCursor?: string): object {
  return { servers, metadata: { count: servers.length, nextCursor } };
}

// ---------------------------------------------------------------------------
// Test helpers — paths into our tmpDir cache
// ---------------------------------------------------------------------------

let tmpDir: string;

function cacheRoot(): string {
  return path.join(tmpDir, "getmcp", "registry-cache");
}

function registryDir(name: string): string {
  return path.join(cacheRoot(), name);
}

function metaPath(registryName: string): string {
  return path.join(registryDir(registryName), "cache-metadata.json");
}

function serversPath(registryName: string): string {
  return path.join(registryDir(registryName), "servers.json");
}

function writeMetaFile(
  registryName: string,
  data: { syncedAt: string; lastCheckedAt: string; lastUpdatedSince?: string },
): void {
  fs.mkdirSync(registryDir(registryName), { recursive: true });
  fs.writeFileSync(metaPath(registryName), JSON.stringify(data), "utf-8");
}

function writeServersFile(registryName: string, data: unknown = []): void {
  fs.mkdirSync(registryDir(registryName), { recursive: true });
  fs.writeFileSync(serversPath(registryName), JSON.stringify(data), "utf-8");
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-cache-test-"));
  vi.stubEnv("XDG_CONFIG_HOME", tmpDir);

  // Default: only official registry
  vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);
  vi.mocked(buildAuthHeaders).mockReturnValue({});
  vi.mocked(loadFromEntries).mockReset();
  vi.mocked(extractServerConfig).mockReset();
  vi.mocked(transformToInternal).mockReturnValue(null); // no enrichment by default
  vi.mocked(generateSlug).mockImplementation((n: string) => n.split("/").pop()!.toLowerCase());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// getRegistryCacheDir
// ---------------------------------------------------------------------------

describe("getRegistryCacheDir", () => {
  it("returns correct path on macOS/Linux (XDG)", () => {
    vi.stubEnv("XDG_CONFIG_HOME", "/custom/config");
    const result = getRegistryCacheDir();
    expect(result).toBe(path.join("/custom/config", "getmcp", "registry-cache"));
  });

  it("falls back to ~/.config when XDG_CONFIG_HOME is unset", () => {
    delete process.env.XDG_CONFIG_HOME;
    const result = getRegistryCacheDir();
    expect(result).toBe(path.join(os.homedir(), ".config", "getmcp", "registry-cache"));
  });
});

// ---------------------------------------------------------------------------
// fetchFromRegistryAPI
// ---------------------------------------------------------------------------

describe("fetchFromRegistryAPI", () => {
  it("fetches a single page of servers", async () => {
    const servers = [makeServer("io.github.test/my-mcp")];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse(servers)), { status: 200 }),
    );

    const result = await fetchFromRegistryAPI(OFFICIAL_REGISTRY);

    expect(result).toHaveLength(1);
    expect(result[0].server.name).toBe("io.github.test/my-mcp");

    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).toContain("/v0.1/servers");
    expect(call).toContain("limit=100");
    expect(call).toContain("version=latest");
  });

  it("follows cursor for paginated responses", async () => {
    const page1 = [makeServer("io.test/server-a")];
    const page2 = [makeServer("io.test/server-b")];

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeApiResponse(page1, "cursor-abc")), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeApiResponse(page2, undefined)), { status: 200 }),
      );

    const result = await fetchFromRegistryAPI(OFFICIAL_REGISTRY);

    expect(result).toHaveLength(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    const secondCall = vi.mocked(globalThis.fetch).mock.calls[1][0] as string;
    expect(secondCall).toContain("cursor=cursor-abc");
  });

  it("adds updated_since parameter when provided", async () => {
    const servers = [makeServer("io.test/server-a")];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse(servers)), { status: 200 }),
    );

    await fetchFromRegistryAPI(OFFICIAL_REGISTRY, "2024-06-15T10:00:00Z");

    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).toContain("updated_since=2024-06-15T10%3A00%3A00Z");
  });

  it("applies auth headers for private registries", async () => {
    vi.mocked(buildAuthHeaders).mockReturnValue({ Authorization: "Bearer test-token" });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await fetchFromRegistryAPI(COMPANY_REGISTRY);

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer test-token");
    expect(vi.mocked(buildAuthHeaders)).toHaveBeenCalledWith("company");
  });

  it("throws on non-200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));

    await expect(fetchFromRegistryAPI(OFFICIAL_REGISTRY)).rejects.toThrow("HTTP 403");
  });
});

// ---------------------------------------------------------------------------
// initRegistryCache
// ---------------------------------------------------------------------------

describe("initRegistryCache", () => {
  it("uses cached file when TTL has not expired (no network)", async () => {
    const now = new Date().toISOString();
    const servers = [makeServer("io.test/server-a")];
    writeMetaFile("official", {
      syncedAt: now,
      lastCheckedAt: now,
      lastUpdatedSince: now,
    });
    writeServersFile("official", servers);

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await initRegistryCache();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches from API when TTL has expired", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeMetaFile("official", {
      syncedAt: oldTime,
      lastCheckedAt: oldTime,
      lastUpdatedSince: oldTime,
    });
    writeServersFile("official", [makeServer("io.test/existing")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([makeServer("io.test/fresh")])), { status: 200 }),
    );

    await initRegistryCache();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).toContain("/v0.1/servers");
  });

  it("performs incremental fetch using lastUpdatedSince when cache exists", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    const syncTime = "2024-06-15T10:00:00Z";
    writeMetaFile("official", {
      syncedAt: oldTime,
      lastCheckedAt: oldTime,
      lastUpdatedSince: syncTime,
    });
    writeServersFile("official", [makeServer("io.test/existing")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await initRegistryCache();

    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).toContain(`updated_since=${encodeURIComponent(syncTime)}`);
  });

  it("merges incremental updates into existing cached entries by server name", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    const syncTime = "2024-06-15T10:00:00Z";
    const existing = [makeServer("io.test/server-a"), makeServer("io.test/server-b")];
    writeMetaFile("official", {
      syncedAt: oldTime,
      lastCheckedAt: oldTime,
      lastUpdatedSince: syncTime,
    });
    writeServersFile("official", existing);

    // Incremental update: server-b updated, server-c added
    const updates = [
      { ...makeServer("io.test/server-b"), _meta: { updated: true } },
      makeServer("io.test/server-c"),
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse(updates)), { status: 200 }),
    );

    await initRegistryCache();

    const written = JSON.parse(
      fs.readFileSync(serversPath("official"), "utf-8"),
    ) as RegistryEntryType[];
    expect(written).toHaveLength(3); // a, b (updated), c (new)
    const serverBEntry = written.find((s) => s.server.name === "io.test/server-b");
    expect(serverBEntry?._meta).toEqual({ updated: true });
  });

  it("falls back to cached file when offline", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    const servers = [makeServer("io.test/server-a")];
    writeMetaFile("official", {
      syncedAt: oldTime,
      lastCheckedAt: oldTime,
    });
    writeServersFile("official", servers);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    // Should not throw — falls back to cached data
    await expect(initRegistryCache()).resolves.toBeUndefined();
  });

  it("does not call loadFromEntries when offline and no cache exists", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    await initRegistryCache();

    // No cached data and no network → loadFromEntries not called
    expect(loadFromEntries).not.toHaveBeenCalled();
  });

  it("writes final files without .tmp leftovers (atomic rename)", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeMetaFile("official", {
      syncedAt: oldTime,
      lastCheckedAt: oldTime,
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([makeServer("io.test/server-a")])), {
        status: 200,
      }),
    );

    await initRegistryCache();

    expect(fs.existsSync(serversPath("official"))).toBe(true);
    expect(fs.existsSync(serversPath("official") + ".tmp")).toBe(false);
    expect(fs.existsSync(metaPath("official"))).toBe(true);
    expect(fs.existsSync(metaPath("official") + ".tmp")).toBe(false);
  });

  it("updates lastCheckedAt and lastUpdatedSince after successful fetch", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeMetaFile("official", {
      syncedAt: oldTime,
      lastCheckedAt: oldTime,
    });

    const beforeFetch = Date.now();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await initRegistryCache();

    const meta = JSON.parse(fs.readFileSync(metaPath("official"), "utf-8")) as {
      lastCheckedAt: string;
      lastUpdatedSince: string;
    };
    expect(new Date(meta.lastCheckedAt).getTime()).toBeGreaterThanOrEqual(beforeFetch);
    expect(meta.lastUpdatedSince).toBeDefined();
  });

  it("isolates failures — second registry loads even if first fails", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY, COMPANY_REGISTRY]);

    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeMetaFile("company", { syncedAt: oldTime, lastCheckedAt: oldTime });
    writeServersFile("company", [makeServer("com.company/server-a")]);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("registry.modelcontextprotocol.io")) {
        throw new Error("official registry down");
      }
      // company succeeds
      return new Response(JSON.stringify(makeApiResponse([makeServer("com.company/server-a")])), {
        status: 200,
      });
    });

    // Should not throw even though official registry fails
    await expect(initRegistryCache()).resolves.toBeUndefined();
  });

  it("loads multiple registries and passes all entries to loadFromEntries", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY, COMPANY_REGISTRY]);

    const now = new Date().toISOString();
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("official", [makeServer("io.test/server-a")]);
    writeMetaFile("company", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("company", [makeServer("com.company/server-b")]);

    vi.mocked(extractServerConfig).mockReturnValue({
      config: { command: "npx", args: [], env: {}, transport: "stdio" },
      requiredEnvVars: [],
      envVarDetails: [],
    });

    await initRegistryCache();

    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];
    expect(entries).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// refreshRegistryCache
// ---------------------------------------------------------------------------

describe("refreshRegistryCache", () => {
  it("always fetches regardless of TTL", async () => {
    const now = new Date().toISOString();
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now, lastUpdatedSince: now });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([makeServer("io.test/fresh")])), { status: 200 }),
    );

    const result = await refreshRegistryCache();

    expect(result).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns true when at least one registry succeeds", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY, COMPANY_REGISTRY]);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("registry.modelcontextprotocol.io")) {
        throw new Error("official down");
      }
      return new Response(JSON.stringify(makeApiResponse([])), { status: 200 });
    });

    const result = await refreshRegistryCache();

    expect(result).toBe(true);
  });

  it("returns false when all registries fail", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await refreshRegistryCache();

    expect(result).toBe(false);
  });

  it("performs full fetch (no updated_since) when mode is 'full'", async () => {
    const syncTime = "2024-06-15T10:00:00Z";
    writeMetaFile("official", {
      syncedAt: syncTime,
      lastCheckedAt: syncTime,
      lastUpdatedSince: syncTime,
    });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await refreshRegistryCache("full");

    // Full mode clears cache first, so no updated_since
    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).not.toContain("updated_since");
  });

  it("performs incremental fetch (uses updated_since) when mode is 'incremental'", async () => {
    const syncTime = "2024-06-15T10:00:00Z";
    writeMetaFile("official", {
      syncedAt: syncTime,
      lastCheckedAt: syncTime,
      lastUpdatedSince: syncTime,
    });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await refreshRegistryCache("incremental");

    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).toContain(`updated_since=${encodeURIComponent(syncTime)}`);
  });

  it("defaults to 'full' mode when no argument is provided", async () => {
    const syncTime = "2024-06-15T10:00:00Z";
    writeMetaFile("official", {
      syncedAt: syncTime,
      lastCheckedAt: syncTime,
      lastUpdatedSince: syncTime,
    });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await refreshRegistryCache();

    // Default (full) clears cache, so no updated_since
    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).not.toContain("updated_since");
  });

  it("full refresh with fetch failure still falls back to bundled data", async () => {
    const syncTime = "2024-06-15T10:00:00Z";
    writeMetaFile("official", {
      syncedAt: syncTime,
      lastCheckedAt: syncTime,
      lastUpdatedSince: syncTime,
    });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await refreshRegistryCache("full");

    // Cache was cleared and fetch failed → no data
    expect(result).toBe(false);
    // Cache directory should have been cleared
    expect(fs.existsSync(serversPath("official"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mergeRegistryData — collision resolution
// ---------------------------------------------------------------------------

describe("mergeRegistryData (via initRegistryCache)", () => {
  it("uses official name as ID — same server in multiple registries keeps higher priority", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY, COMPANY_REGISTRY]);

    const now = new Date().toISOString();
    // Same server name in both registries — higher priority wins
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("official", [makeServer("io.github.shared/my-server")]);

    writeMetaFile("company", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("company", [makeServer("io.github.shared/my-server")]);

    vi.mocked(extractServerConfig).mockReturnValue({
      config: { command: "npx", args: [], env: {}, transport: "stdio" },
      requiredEnvVars: [],
      envVarDetails: [],
    });

    await initRegistryCache();

    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];

    // Only one entry (higher-priority official wins)
    const matching = entries.filter((e) => e.id === "io.github.shared/my-server");
    expect(matching).toHaveLength(1);
    expect(matching[0].registrySource).toBe("official");
  });

  it("different servers with same slug both get included (IDs are unique)", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY, COMPANY_REGISTRY]);

    const now = new Date().toISOString();
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("official", [makeServer("io.github.official/my-server")]);

    writeMetaFile("company", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("company", [makeServer("com.company/my-server")]);

    vi.mocked(extractServerConfig).mockReturnValue({
      config: { command: "npx", args: [], env: {}, transport: "stdio" },
      requiredEnvVars: [],
      envVarDetails: [],
    });

    await initRegistryCache();

    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];

    // Both get included — different official names = different IDs
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.id === "io.github.official/my-server")).toBeDefined();
    expect(entries.find((e) => e.id === "com.company/my-server")).toBeDefined();
  });

  it("uses transformToInternal for enriched entries", async () => {
    const now = new Date().toISOString();
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now });
    const server = makeServer("io.test/enriched-server");
    writeServersFile("official", [server]);

    const enriched = {
      id: "io.test/enriched-server",
      slug: "enriched-server",
      name: "Enriched Server",
      description: "desc",
      config: { command: "npx", args: [], env: {}, transport: "stdio" as const },
      categories: ["developer-tools"],
      requiredEnvVars: [],
      isOfficial: true,
    };
    vi.mocked(transformToInternal).mockReturnValueOnce(enriched);

    await initRegistryCache();

    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];
    expect(entries[0].registrySource).toBe("official");
    expect(entries[0].name).toBe("Enriched Server");
  });

  it("uses transformToInternalRaw for non-enriched entries", async () => {
    const now = new Date().toISOString();
    writeMetaFile("company", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("company", [makeServer("com.company.myorg/some-mcp")]);

    vi.mocked(getAllRegistries).mockReturnValue([COMPANY_REGISTRY]);
    vi.mocked(transformToInternal).mockReturnValue(null); // no enrichment

    vi.mocked(extractServerConfig).mockReturnValue({
      config: { command: "npx", args: ["-y", "@scope/some-mcp"], env: {}, transport: "stdio" },
      requiredEnvVars: [],
      envVarDetails: [],
    });

    await initRegistryCache();

    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];
    expect(entries[0].registrySource).toBe("company");
    expect(entries[0].isOfficial).toBe(false);
    expect(entries[0].id).toBe("com.company.myorg/some-mcp");
  });
});

// ---------------------------------------------------------------------------
// initProjectRegistries
// ---------------------------------------------------------------------------

describe("initProjectRegistries", () => {
  it("does nothing when projectRegistries is empty", async () => {
    await initProjectRegistries([]);
    expect(loadFromEntries).not.toHaveBeenCalled();
  });

  it("fetches novel project registries not in global config", async () => {
    const projectRegistry: RegistrySource = {
      name: "project-internal",
      url: "https://mcp.project.internal",
      type: "private",
      priority: 10,
    };

    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([makeServer("com.project/server-a")])), {
        status: 200,
      }),
    );

    await initProjectRegistries([projectRegistry]);

    // Fetch should have been called for the novel project registry
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const call = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(call).toContain("mcp.project.internal");
  });

  it("does not re-fetch registries already in global config", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    const now = new Date().toISOString();
    // official already cached and fresh
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("official", []);

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await initProjectRegistries([OFFICIAL_REGISTRY]);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("merges project registries with global config for final load", async () => {
    const projectRegistry: RegistrySource = {
      name: "project-internal",
      url: "https://mcp.project.internal",
      type: "private",
      priority: 10,
    };

    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    const now = new Date().toISOString();
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([makeServer("com.project/server-b")])), {
        status: 200,
      }),
    );

    vi.mocked(extractServerConfig).mockReturnValue({
      config: { command: "npx", args: [], env: {}, transport: "stdio" },
      requiredEnvVars: [],
      envVarDetails: [],
    });

    await initProjectRegistries([projectRegistry]);

    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];
    const registrySources = entries.map((e) => e.registrySource);
    expect(registrySources).toContain("official");
    expect(registrySources).toContain("project-internal");
  });
});

// ---------------------------------------------------------------------------
// cleanOrphanedCaches
// ---------------------------------------------------------------------------

describe("cleanOrphanedCaches", () => {
  it("removes directories for registries no longer configured", () => {
    // Create cache dirs for official and an old registry
    fs.mkdirSync(registryDir("official"), { recursive: true });
    fs.mkdirSync(registryDir("old-registry"), { recursive: true });

    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    cleanOrphanedCaches();

    expect(fs.existsSync(registryDir("official"))).toBe(true);
    expect(fs.existsSync(registryDir("old-registry"))).toBe(false);
  });

  it("does nothing when all cached dirs correspond to configured registries", () => {
    fs.mkdirSync(registryDir("official"), { recursive: true });

    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    cleanOrphanedCaches();

    expect(fs.existsSync(registryDir("official"))).toBe(true);
  });

  it("does nothing when cache root does not exist", () => {
    // tmpDir is clean — no cache root yet
    expect(() => cleanOrphanedCaches()).not.toThrow();
  });

  it("ignores files (non-directories) in the cache root", () => {
    fs.mkdirSync(cacheRoot(), { recursive: true });
    fs.writeFileSync(path.join(cacheRoot(), "some-file.json"), "{}", "utf-8");

    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    expect(() => cleanOrphanedCaches()).not.toThrow();
    expect(fs.existsSync(path.join(cacheRoot(), "some-file.json"))).toBe(true);
  });

  it("removes multiple orphaned registries in one call", () => {
    fs.mkdirSync(registryDir("official"), { recursive: true });
    fs.mkdirSync(registryDir("orphan-1"), { recursive: true });
    fs.mkdirSync(registryDir("orphan-2"), { recursive: true });

    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    cleanOrphanedCaches();

    expect(fs.existsSync(registryDir("orphan-1"))).toBe(false);
    expect(fs.existsSync(registryDir("orphan-2"))).toBe(false);
    expect(fs.existsSync(registryDir("official"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clearRegistryCache
// ---------------------------------------------------------------------------

describe("clearRegistryCache", () => {
  it("deletes cache directories for all configured registries", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY, COMPANY_REGISTRY]);

    writeMetaFile("official", { syncedAt: "t", lastCheckedAt: "t" });
    writeServersFile("official", [makeServer("io.test/server-a")]);
    writeMetaFile("company", { syncedAt: "t", lastCheckedAt: "t" });
    writeServersFile("company", [makeServer("com.company/server-a")]);

    expect(fs.existsSync(registryDir("official"))).toBe(true);
    expect(fs.existsSync(registryDir("company"))).toBe(true);

    await clearRegistryCache();

    expect(fs.existsSync(registryDir("official"))).toBe(false);
    expect(fs.existsSync(registryDir("company"))).toBe(false);
  });

  it("does not throw when cache directories do not exist", async () => {
    vi.mocked(getAllRegistries).mockReturnValue([OFFICIAL_REGISTRY]);

    await expect(clearRegistryCache()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TTL behaviour
// ---------------------------------------------------------------------------

describe("TTL behaviour", () => {
  it("skips network when cache is fresh (within 1 hour)", async () => {
    const now = new Date().toISOString();
    writeMetaFile("official", { syncedAt: now, lastCheckedAt: now, lastUpdatedSince: now });
    writeServersFile("official", [makeServer("io.test/server-a")]);

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await initRegistryCache();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("triggers fetch when cache is older than 1 hour", async () => {
    const oldTime = new Date(Date.now() - 3_601_000).toISOString();
    writeMetaFile("official", { syncedAt: oldTime, lastCheckedAt: oldTime });
    writeServersFile("official", []);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(makeApiResponse([])), { status: 200 }),
    );

    await initRegistryCache();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Offline fallback
// ---------------------------------------------------------------------------

describe("offline fallback", () => {
  it("serves stale cache data when fetch fails", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    const cachedServers = [makeServer("io.test/stale-server")];
    writeMetaFile("official", { syncedAt: oldTime, lastCheckedAt: oldTime });
    writeServersFile("official", cachedServers);

    vi.mocked(extractServerConfig).mockReturnValue({
      config: { command: "npx", args: [], env: {}, transport: "stdio" },
      requiredEnvVars: [],
      envVarDetails: [],
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    await initRegistryCache();

    // loadFromEntries should still be called with cached data
    expect(loadFromEntries).toHaveBeenCalledOnce();
    const [entries] = vi.mocked(loadFromEntries).mock.calls[0];
    expect(entries.some((e) => e.id === "io.test/stale-server")).toBe(true);
  });
});
