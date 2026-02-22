import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { syncCommand } from "../../src/commands/sync.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
}));

// Mock detectApps to avoid filesystem access
vi.mock("../../src/detect.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/detect.js")>();
  return {
    ...actual,
    detectApps: vi.fn(() => []),
  };
});

// Mock config-file to avoid filesystem access
vi.mock("../../src/config-file.js", () => ({
  mergeServerIntoConfig: vi.fn(() => ({})),
  writeConfigFile: vi.fn(),
}));

// Mock lock file
vi.mock("../../src/lock.js", () => ({
  trackInstallation: vi.fn(),
}));

let consoleSpy: ReturnType<typeof vi.spyOn>;
let tmpDir: string;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-sync-test-"));
});

afterEach(() => {
  consoleSpy.mockRestore();
  vi.clearAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// syncCommand
// ---------------------------------------------------------------------------

describe("syncCommand", () => {
  it("reports error when getmcp.json not found", async () => {
    await syncCommand({ manifestPath: path.join(tmpDir, "getmcp.json") });

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("No getmcp.json found"));
  });

  it("outputs JSON error when manifest not found with --json", async () => {
    await syncCommand({ json: true, manifestPath: path.join(tmpDir, "getmcp.json") });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("error");
    expect(parsed.error).toContain("getmcp.json not found");
  });

  it("syncs servers from valid manifest", async () => {
    const manifestPath = path.join(tmpDir, "getmcp.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ servers: { github: {}, memory: {} } }));

    const { detectApps } = await import("../../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: path.join(tmpDir, "config.json"),
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await syncCommand({ json: true, manifestPath });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("servers");
    expect(parsed.servers).toEqual(["github", "memory"]);
    expect(parsed.results.length).toBe(2);
  });

  it("reports empty manifest", async () => {
    const manifestPath = path.join(tmpDir, "getmcp.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ servers: {} }));

    await syncCommand({ manifestPath });

    const { log } = await import("@clack/prompts");
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("No servers declared"));
  });

  it("warns about servers not in registry", async () => {
    const manifestPath = path.join(tmpDir, "getmcp.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ servers: { "nonexistent-server": {} } }));

    const { detectApps } = await import("../../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: path.join(tmpDir, "config.json"),
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await syncCommand({ json: true, manifestPath });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    const result = parsed.results.find(
      (r: { serverId: string }) => r.serverId === "nonexistent-server",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Not found in registry");
  });
});
