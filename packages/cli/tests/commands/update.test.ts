import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateCommand } from "../../src/commands/update.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: vi.fn(() => true),
  isCancel: vi.fn(() => false),
}));

// Mock detectApps to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectApps: vi.fn(() => []),
}));

// Mock config-file to avoid filesystem access
vi.mock("../../src/config-file.js", () => ({
  mergeServerIntoConfig: vi.fn(() => ({})),
  writeConfigFile: vi.fn(),
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
// updateCommand
// ---------------------------------------------------------------------------

describe("updateCommand", () => {
  it("returns early when no tracked installations", async () => {
    await updateCommand({ yes: true });

    const { log, outro } = await import("@clack/prompts");
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("No tracked installations"));
    expect(outro).toHaveBeenCalledWith("Done");
  });

  it("skips servers not in registry", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");

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

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await updateCommand({ yes: true });

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("not found in registry"));
  });

  it("calls mergeServerIntoConfig and writeConfigFile for tracked servers", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { mergeServerIntoConfig, writeConfigFile } = await import("../../src/config-file.js");

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

    await updateCommand({ yes: true });

    expect(mergeServerIntoConfig).toHaveBeenCalled();
    expect(writeConfigFile).toHaveBeenCalled();
  });

  it("updates tracking timestamp after successful update", async () => {
    const { getTrackedServers, trackInstallation } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");

    (getTrackedServers as ReturnType<typeof vi.fn>).mockReturnValue({
      version: 1,
      installations: {
        github: {
          apps: ["claude-desktop"],
          installedAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          envVars: ["GITHUB_TOKEN"],
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

    await updateCommand({ yes: true });

    expect(trackInstallation).toHaveBeenCalledWith("github", ["claude-desktop"], ["GITHUB_TOKEN"]);
  });

  it("skips writes in --dry-run mode", async () => {
    const { getTrackedServers } = await import("../../src/lock.js");
    const { detectApps } = await import("../../src/detect.js");
    const { writeConfigFile } = await import("../../src/config-file.js");
    const { trackInstallation } = await import("../../src/lock.js");

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

    await updateCommand({ yes: true, dryRun: true });

    expect(writeConfigFile).not.toHaveBeenCalled();
    expect(trackInstallation).not.toHaveBeenCalled();
  });

  it("warns when app not available on platform", async () => {
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

    // No apps detected — so claude-desktop won't be in the map
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([]);

    await updateCommand({ yes: true });

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining("app not available on this platform"),
    );
  });

  it("reports update counts in outro", async () => {
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

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await updateCommand({ yes: true });

    const { outro } = await import("@clack/prompts");
    expect(outro).toHaveBeenCalledWith(expect.stringContaining("Updated: 1"));
  });
});
