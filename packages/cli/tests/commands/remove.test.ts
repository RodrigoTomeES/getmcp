import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { removeCommand } from "../../src/commands/remove.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
  multiselect: vi.fn(),
  confirm: vi.fn(() => true),
  isCancel: vi.fn(() => false),
}));

// Mock detectInstalledApps to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectInstalledApps: vi.fn(() => []),
}));

// Mock config-file to avoid filesystem access
vi.mock("../../src/config-file.js", () => ({
  listServersInConfig: vi.fn(() => []),
  removeServerFromConfig: vi.fn(() => null),
  writeConfigFile: vi.fn(),
}));

// Mock lock file
vi.mock("../../src/lock.js", () => ({
  trackRemoval: vi.fn(),
}));

let consoleSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  exitSpy = vi.spyOn(process, "exit").mockImplementation(((code: number) => {
    throw new ExitError(code);
  }) as never);
});

afterEach(() => {
  consoleSpy.mockRestore();
  exitSpy.mockRestore();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// removeCommand
// ---------------------------------------------------------------------------

describe("removeCommand", () => {
  it("exits with error when no server name provided in non-interactive mode", async () => {
    // Must have detected apps for the code to reach the no-server-name check
    const { detectInstalledApps } = await import("../../src/detect.js");
    const mockDetect = detectInstalledApps as ReturnType<typeof vi.fn>;
    mockDetect.mockReturnValueOnce([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/test.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await expect(removeCommand(undefined, { yes: true })).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Usage: getmcp remove"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("warns when no apps detected", async () => {
    await removeCommand("some-server", { yes: true });

    const { log, outro } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("No AI applications detected"));
    expect(outro).toHaveBeenCalledWith("Done");
  });

  it("warns when server not found in any app config", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig } = await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["other-server"]);

    await removeCommand("nonexistent-server", { yes: true });

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining("was not found in any detected app config"),
    );
  });

  it("removes server and calls writeConfigFile + trackRemoval", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig, removeServerFromConfig, writeConfigFile } =
      await import("../../src/config-file.js");
    const { trackRemoval } = await import("../../src/lock.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);
    (removeServerFromConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      mcpServers: {},
    });

    await removeCommand("github", { yes: true });

    expect(writeConfigFile).toHaveBeenCalledWith("/tmp/config.json", { mcpServers: {} });
    expect(trackRemoval).toHaveBeenCalledWith("github", ["claude-desktop"]);
  });

  it("skips writes in --dry-run mode", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig, removeServerFromConfig, writeConfigFile } =
      await import("../../src/config-file.js");
    const { trackRemoval } = await import("../../src/lock.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);
    (removeServerFromConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      mcpServers: {},
    });

    await removeCommand("github", { yes: true, dryRun: true });

    expect(writeConfigFile).not.toHaveBeenCalled();
    expect(trackRemoval).not.toHaveBeenCalled();
  });

  it("skips confirmation in --yes mode", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig, removeServerFromConfig } =
      await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);
    (removeServerFromConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      mcpServers: {},
    });

    await removeCommand("github", { yes: true });

    const { confirm } = await import("@clack/prompts");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("outputs JSON with --json flag", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig, removeServerFromConfig } =
      await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);
    (removeServerFromConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      mcpServers: {},
    });

    await removeCommand("github", { yes: true, json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed.server).toBe("github");
    expect(parsed.apps).toHaveLength(1);
    expect(parsed.apps[0].id).toBe("claude-desktop");
    expect(parsed.apps[0].removed).toBe(true);
    expect(parsed.dryRun).toBe(false);
  });

  it("outputs JSON with dryRun flag in --json mode", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig, removeServerFromConfig, writeConfigFile } =
      await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);
    (removeServerFromConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      mcpServers: {},
    });

    await removeCommand("github", { yes: true, json: true, dryRun: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed.dryRun).toBe(true);
    expect(writeConfigFile).not.toHaveBeenCalled();
  });

  it("handles removeServerFromConfig returning null (not found during removal)", async () => {
    const { detectInstalledApps } = await import("../../src/detect.js");
    const { listServersInConfig, removeServerFromConfig, writeConfigFile } =
      await import("../../src/config-file.js");

    (detectInstalledApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    (listServersInConfig as ReturnType<typeof vi.fn>).mockReturnValue(["github"]);
    (removeServerFromConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await removeCommand("github", { yes: true });

    expect(writeConfigFile).not.toHaveBeenCalled();

    const { log } = await import("@clack/prompts");
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("not found (skipped)"));
  });
});
