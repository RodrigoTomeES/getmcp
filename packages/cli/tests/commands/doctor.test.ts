import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { doctorCommand } from "../../src/commands/doctor.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// Mock detectInstalledApps to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectInstalledApps: vi.fn(() => []),
}));

// Mock lock file to avoid filesystem access
vi.mock("../../src/lock.js", () => ({
  getTrackedServers: vi.fn(() => ({ version: 1, installations: {} })),
}));

// Mock child_process to avoid running real commands
vi.mock("node:child_process", () => ({
  execSync: vi.fn((cmd: string) => {
    if (cmd.startsWith("node")) return "v22.0.0";
    if (cmd.startsWith("npx")) return "10.0.0";
    if (cmd.startsWith("uvx")) throw new Error("not found");
    return "";
  }),
}));

let consoleSpy: ReturnType<typeof vi.spyOn>;

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
});
