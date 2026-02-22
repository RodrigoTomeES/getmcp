import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { importCommand } from "../../src/commands/import.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
  multiselect: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// Mock detectInstalledApps to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectInstalledApps: vi.fn(() => []),
}));

// Mock config-file to avoid filesystem access
vi.mock("../../src/config-file.js", () => ({
  readConfigFile: vi.fn(() => ({})),
  ROOT_KEYS: ["mcpServers", "servers", "extensions", "mcp", "context_servers", "mcp_servers"],
}));

// Mock lock file
vi.mock("../../src/lock.js", () => ({
  getTrackedServers: vi.fn(() => ({ version: 1, installations: {} })),
  trackInstallation: vi.fn(),
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
// importCommand
// ---------------------------------------------------------------------------

describe("importCommand", () => {
  it("warns when no apps detected", async () => {
    await importCommand();

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("No AI applications detected"));
  });

  it("outputs JSON when no apps detected with --json", async () => {
    await importCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("apps");
    expect(parsed).toHaveProperty("discovered");
    expect(parsed.apps).toEqual([]);
  });

  it("discovers servers from app configs", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { readConfigFile } = await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (readConfigFile as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
        "custom-server": {
          command: "node",
          args: ["./server.js"],
        },
      },
    });

    await importCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed.discovered.length).toBe(2);
    // github should be matched to registry
    const ghServer = parsed.discovered.find((s: { name: string }) => s.name === "github");
    expect(ghServer.registryId).toBe("github");
    // custom-server should not be matched
    const customServer = parsed.discovered.find(
      (s: { name: string }) => s.name === "custom-server",
    );
    expect(customServer.registryId).toBeUndefined();
  });

  it("reports no servers found when configs are empty", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { readConfigFile } = await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (readConfigFile as ReturnType<typeof vi.fn>).mockReturnValueOnce({});

    await importCommand();

    const { log } = await import("@clack/prompts");
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("No servers found"));
  });

  it("imports matched servers in non-interactive mode", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { readConfigFile } = await import("../../src/config-file.js");
    const { trackInstallation } = await import("../../src/lock.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (readConfigFile as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    });

    await importCommand({ yes: true });

    expect(trackInstallation).toHaveBeenCalledWith("github", ["claude-desktop"], []);
  });
});
