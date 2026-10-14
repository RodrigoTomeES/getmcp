import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { doctorCommand } from "../../src/commands/doctor.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// Mock detectInstalledApps to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectInstalledApps: vi.fn(() => []),
  getReadableConfigPaths: vi.fn((app: { configPath: string }) => [
    { scope: "project" as const, path: app.configPath },
  ]),
}));

// Mock lock file to avoid filesystem access
vi.mock("../../src/lock.js", () => ({
  getTrackedServers: vi.fn(() => ({ version: 1, installations: {} })),
}));

// Mock child_process to avoid running real commands
vi.mock("node:child_process", () => ({
  execFileSync: vi.fn((cmd: string) => {
    if (cmd === "node") return Buffer.from("v22.0.0");
    if (cmd === "npx") return Buffer.from("10.0.0");
    if (cmd === "uvx") throw new Error("not found");
    return Buffer.from("");
  }),
}));

let consoleSpy: MockInstance;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// doctorCommand
// ---------------------------------------------------------------------------

describe("doctorCommand", () => {
  it("runs without errors when no apps detected", async () => {
    await doctorCommand();

    const { log, outro } = await import("@clack/prompts");
    // Should have warnings about no apps and uvx not found
    expect(log.warn).toHaveBeenCalled();
    expect(outro).toHaveBeenCalled();
  });

  it("outputs valid JSON with --json flag", async () => {
    await doctorCommand({ json: true });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    // Should contain diagnostic results
    for (const result of parsed) {
      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      expect(["ok", "warn", "error"]).toContain(result.status);
    }
  });

  it("checks runtime dependencies", async () => {
    await doctorCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    const runtimeResults = parsed.filter((r: { category: string }) => r.category === "runtime");
    // Should check node, npx, uvx
    expect(runtimeResults.length).toBe(3);
    const nodeResult = runtimeResults.find((r: { message: string }) => r.message.includes("node"));
    expect(nodeResult.status).toBe("ok");
    expect(nodeResult.message).toContain("v22.0.0");
  });

  it("reports no apps detected as warning", async () => {
    await doctorCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    const appsResult = parsed.find((r: { category: string }) => r.category === "apps");
    expect(appsResult.status).toBe("warn");
    expect(appsResult.message).toContain("No AI applications detected");
  });

  it("reports detected apps with config parsing", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const mockDetect = detectInstalledApps as ReturnType<typeof vi.fn>;
    mockDetect.mockReturnValueOnce([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/nonexistent-config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await doctorCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    const appsResult = parsed.find((r: { category: string }) => r.category === "apps");
    expect(appsResult.status).toBe("ok");
    expect(appsResult.message).toContain("1 AI application(s) detected");
  });

  // Regression: OpenCode declared no global config path, so doctor read the
  // relative opencode.json, parsed {} and reported zero servers while still
  // claiming the config was valid.
  it("reports servers from a global-only config", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-doctor-"));
    const globalConfig = path.join(tmpDir, "opencode.json");
    fs.writeFileSync(
      globalConfig,
      JSON.stringify({ mcp: { exa: { type: "local", command: ["npx", "exa"] } } }),
    );

    const { detectInstalledApps, getReadableConfigPaths } = await import("../../src/detect.js");
    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      {
        id: "opencode",
        name: "OpenCode",
        configPath: "opencode.json",
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: globalConfig,
      },
    ]);
    (getReadableConfigPaths as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      { scope: "global", path: globalConfig },
    ]);

    try {
      await doctorCommand({ json: true });

      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      const parsed = JSON.parse(output) as { category: string; details?: string }[];

      // The server in the global config is seen and attributed to OpenCode
      const serverResult = parsed.find((r) => r.category === "server-status");
      expect(serverResult).toBeDefined();
      expect(serverResult!.details).toContain("opencode");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("labels the scope when an app has configs in both scopes", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-doctor-"));
    const projectConfig = path.join(tmpDir, "project.json");
    const globalConfig = path.join(tmpDir, "global.json");
    fs.writeFileSync(projectConfig, JSON.stringify({ mcp: {} }));
    fs.writeFileSync(globalConfig, JSON.stringify({ mcp: {} }));

    const { detectInstalledApps, getReadableConfigPaths } = await import("../../src/detect.js");
    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      {
        id: "opencode",
        name: "OpenCode",
        configPath: projectConfig,
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: globalConfig,
      },
    ]);
    (getReadableConfigPaths as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      { scope: "project", path: projectConfig },
      { scope: "global", path: globalConfig },
    ]);

    try {
      await doctorCommand({ json: true });

      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      const parsed = JSON.parse(output) as { category: string; message: string }[];
      const parseResults = parsed.filter((r) => r.category === "config-parse");

      expect(parseResults).toHaveLength(2);
      expect(parseResults[0]!.message).toContain("OpenCode (project)");
      expect(parseResults[1]!.message).toContain("OpenCode (global)");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
