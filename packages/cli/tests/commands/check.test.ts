import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkCommand } from "../../src/commands/check.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// Mock detectApps and resolveAppForScope to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectApps: vi.fn(() => []),
  resolveAppForScope: vi.fn(
    (
      app: { configPath: string; globalConfigPath?: string; supportsBothScopes: boolean },
      scope: string,
    ) => {
      if (!app.supportsBothScopes) return app;
      if (scope === "global" && app.globalConfigPath) {
        return { ...app, configPath: app.globalConfigPath };
      }
      return app;
    },
  ),
}));

// Mock config-file to avoid filesystem access
vi.mock("../../src/config-file.js", () => ({
  listServersInConfig: vi.fn(() => []),
}));

// Mock lock file
vi.mock("../../src/lock.js", () => ({
  getTrackedServers: vi.fn(() => ({ version: 1, installations: {} })),
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
// checkCommand
// ---------------------------------------------------------------------------

describe("checkCommand", () => {
  it("shows info message when no tracked installations", async () => {
    await checkCommand();

    const { log, outro } = await import("@clack/prompts");
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("No tracked installations"));
    expect(outro).toHaveBeenCalledWith("Done");
  });

  it("reports server present in config as OK", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);

    await checkCommand();

    const { log } = await import("@clack/prompts");
    expect(log.success).toHaveBeenCalledWith(expect.stringContaining("OK"));
  });

  it("reports server missing from config", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["other-server"]);

    await checkCommand();

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("Missing from"));
  });

  it("reports server not in registry", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        "nonexistent-server-xyz": {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    await checkCommand();

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("no longer in registry"));
  });

  it("outputs valid JSON with --json flag", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);

    await checkCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty("serverId", "github");
    expect(parsed[0]).toHaveProperty("inRegistry", true);
    expect(parsed[0].apps[0]).toHaveProperty("status", "present");
  });

  it("JSON output reports app-not-detected status", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    // No installed apps — claude-desktop won't be detected
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([]);

    await checkCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed[0].apps[0].status).toBe("app-not-detected");
  });

  it("reports issues count in outro", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue([]);

    await checkCommand();

    const { outro } = await import("@clack/prompts");
    expect(outro).toHaveBeenCalledWith(expect.stringContaining("issue(s) found"));
  });

  it("JSON output includes per-app scope (defaults to 'project')", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);

    await checkCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed[0].apps[0]).toHaveProperty("scope", "project");
  });

  it("uses global config path for global-scope app installations", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");
    const { resolveAppForScope } = await import("../../src/detect.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-code"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
          scopes: { "claude-code": "global" },
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-code",
        name: "Claude Code",
        configPath: ".mcp.json",
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: "/home/.claude.json",
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);

    await checkCommand({ json: true });

    // resolveAppForScope should have been called with "global"
    expect(resolveAppForScope).toHaveBeenCalledWith(
      expect.objectContaining({ id: "claude-code" }),
      "global",
    );

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed[0].apps[0]).toHaveProperty("scope", "global");
    expect(parsed[0].apps[0]).toHaveProperty("status", "present");
  });

  it("tracks different scopes per app within same installation", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop", "claude-code"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: [],
          scopes: { "claude-desktop": "project", "claude-code": "global" },
        },
      },
    });

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
      {
        id: "claude-code",
        name: "Claude Code",
        configPath: ".mcp.json",
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: "/home/.claude.json",
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);

    await checkCommand({ json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    const desktopApp = parsed[0].apps.find((a: { app: string }) => a.app === "claude-desktop");
    const codeApp = parsed[0].apps.find((a: { app: string }) => a.app === "claude-code");
    expect(desktopApp).toHaveProperty("scope", "project");
    expect(codeApp).toHaveProperty("scope", "global");
  });
});
