import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Mock @getmcp/registry before importing the module under test
vi.mock("@getmcp/registry", () => ({
  loadFromPath: vi.fn(),
}));

import { loadFromPath } from "@getmcp/registry";
import {
  getRegistryCacheDir,
  initRegistryCache,
  refreshRegistryCache,
} from "../src/registry-cache.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

function cacheDir(): string {
  return path.join(tmpDir, "getmcp", "registry-cache");
}

function metaPath(): string {
  return path.join(cacheDir(), "cache-metadata.json");
}

function serversPath(): string {
  return path.join(cacheDir(), "servers.json");
}

function writeCacheMeta(syncedAt: string, lastCheckedAt: string): void {
  const dir = cacheDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(metaPath(), JSON.stringify({ syncedAt, lastCheckedAt }), "utf-8");
}

function writeCachedServers(data: string = "[]"): void {
  const dir = cacheDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(serversPath(), data, "utf-8");
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-cache-test-"));
  // Point getRegistryCacheDir at our temp directory
  vi.stubEnv("XDG_CONFIG_HOME", tmpDir);
  vi.mocked(loadFromPath).mockReset();
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
// initRegistryCache
// ---------------------------------------------------------------------------

describe("initRegistryCache", () => {
  it("uses cached file when TTL has not expired (no network)", async () => {
    const now = new Date().toISOString();
    writeCacheMeta("2024-01-01T00:00:00Z", now);
    writeCachedServers();

    // No fetch mock — should not make any network requests
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await initRegistryCache();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(loadFromPath).toHaveBeenCalledWith(serversPath());
  });

  it("updates lastCheckedAt when syncedAt is unchanged", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString(); // 2 hours ago
    writeCacheMeta("2024-06-15T10:00:00Z", oldTime);
    writeCachedServers();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("sync-metadata.json")) {
        return new Response(JSON.stringify({ syncedAt: "2024-06-15T10:00:00Z" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    await initRegistryCache();

    expect(loadFromPath).toHaveBeenCalledWith(serversPath());
    // servers.json should NOT have been fetched (only sync-metadata.json)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // lastCheckedAt should have been updated
    const meta = JSON.parse(fs.readFileSync(metaPath(), "utf-8"));
    expect(new Date(meta.lastCheckedAt).getTime()).toBeGreaterThan(new Date(oldTime).getTime());
  });

  it("downloads servers.json when syncedAt differs", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeCacheMeta("2024-06-15T10:00:00Z", oldTime);
    writeCachedServers();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("sync-metadata.json")) {
        return new Response(JSON.stringify({ syncedAt: "2024-06-16T12:00:00Z" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("servers.json")) {
        return new Response('[{"new":"data"}]', { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    await initRegistryCache();

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(loadFromPath).toHaveBeenCalledWith(serversPath());

    // Verify the cached file was updated
    const cached = fs.readFileSync(serversPath(), "utf-8");
    expect(cached).toBe('[{"new":"data"}]');
  });

  it("falls back to cached file when offline", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeCacheMeta("2024-06-15T10:00:00Z", oldTime);
    writeCachedServers("[]");

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    await initRegistryCache();

    expect(loadFromPath).toHaveBeenCalledWith(serversPath());
  });

  it("does not call loadFromPath when offline and no cache exists", async () => {
    // No cache files, no network
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    await initRegistryCache();

    expect(loadFromPath).not.toHaveBeenCalled();
  });

  it("writes final files (not .tmp) after atomic rename", async () => {
    const oldTime = new Date(Date.now() - 7_200_000).toISOString();
    writeCacheMeta("old-sync", oldTime);
    writeCachedServers();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("sync-metadata.json")) {
        return new Response(JSON.stringify({ syncedAt: "new-sync" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("servers.json")) {
        return new Response("[]", { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    await initRegistryCache();

    // Final files should exist and .tmp files should NOT exist (renamed away)
    expect(fs.existsSync(serversPath())).toBe(true);
    expect(fs.existsSync(serversPath() + ".tmp")).toBe(false);
    expect(fs.existsSync(metaPath())).toBe(true);
    expect(fs.existsSync(metaPath() + ".tmp")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// refreshRegistryCache
// ---------------------------------------------------------------------------

describe("refreshRegistryCache", () => {
  it("always downloads regardless of TTL", async () => {
    // Even with fresh cache, refresh should still download
    const now = new Date().toISOString();
    writeCacheMeta("2024-06-15T10:00:00Z", now);
    writeCachedServers();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("sync-metadata.json")) {
        return new Response(JSON.stringify({ syncedAt: "2024-06-15T10:00:00Z" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("servers.json")) {
        return new Response("[]", { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await refreshRegistryCache();

    expect(result).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(loadFromPath).toHaveBeenCalledWith(serversPath());
  });

  it("returns false on failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await refreshRegistryCache();

    expect(result).toBe(false);
  });
});
