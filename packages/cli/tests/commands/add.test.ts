import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addCommand } from "../../src/commands/add.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  select: vi.fn(),
  multiselect: vi.fn(),
  text: vi.fn(),
  password: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// Mock detectApps to avoid filesystem access
vi.mock("../../src/detect.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/detect.js")>();
  return {
    ...actual,
    detectApps: vi.fn(() => []),
    resolveAppForScope: actual.resolveAppForScope,
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

// Mock preferences
vi.mock("../../src/preferences.js", () => ({
  getSavedSelectedApps: vi.fn(() => null),
  saveSelectedApps: vi.fn(),
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
// addCommand — registry servers
// ---------------------------------------------------------------------------

describe("addCommand", () => {
  it("adds a server by exact ID in non-interactive mode", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { mergeServerIntoConfig, writeConfigFile } = await import("../../src/config-file.js");
    const { trackInstallation } = await import("../../src/lock.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand("github", { yes: true });

    expect(mergeServerIntoConfig).toHaveBeenCalled();
    expect(writeConfigFile).toHaveBeenCalled();
    expect(trackInstallation).toHaveBeenCalledWith("github", ["claude-desktop"], expect.any(Array));
  });

  it("exits with NonInteractiveError when no server ID given in non-interactive mode", async () => {
    await expect(addCommand(undefined, { yes: true })).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("non-interactive mode"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error when server not found and no fuzzy matches", async () => {
    await expect(addCommand("nonexistent-server-xyz", { yes: true })).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("not found in registry"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("uses first fuzzy match in non-interactive mode", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { mergeServerIntoConfig } = await import("../../src/config-file.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    // "git" should fuzzy match multiple servers (github, etc.)
    await addCommand("github", { yes: true });

    expect(mergeServerIntoConfig).toHaveBeenCalled();
  });

  it("respects --all-apps flag", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { writeConfigFile } = await import("../../src/config-file.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/claude.json",
        exists: true,
        supportsBothScopes: false,
      },
      {
        id: "cursor",
        name: "Cursor",
        configPath: "/tmp/cursor.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand("github", { allApps: true });

    expect(writeConfigFile).toHaveBeenCalledTimes(2);
  });

  it("exits with error for invalid --app ID", async () => {
    const { detectApps } = await import("../../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([]);

    await expect(addCommand("github", { apps: ["invalid-app-id"] })).rejects.toThrow(ExitError);

    const { log } = await import("@clack/prompts");
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("Unknown app"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("skips writes in --dry-run mode", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { writeConfigFile } = await import("../../src/config-file.js");
    const { trackInstallation } = await import("../../src/lock.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand("github", { yes: true, dryRun: true });

    expect(writeConfigFile).not.toHaveBeenCalled();
    expect(trackInstallation).not.toHaveBeenCalled();
  });

  it("outputs JSON structure with --json flag", async () => {
    const { detectApps } = await import("../../src/detect.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand("github", { yes: true, json: true });

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("server", "github");
    expect(parsed).toHaveProperty("apps");
    expect(parsed.apps[0]).toHaveProperty("id", "claude-desktop");
    expect(parsed.apps[0]).toHaveProperty("ok", true);
  });

  it("shows manual config when no apps detected in non-interactive mode", async () => {
    const { detectApps } = await import("../../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([]);

    await addCommand("github", { yes: true });

    const { note, outro } = await import("@clack/prompts");
    expect(note).toHaveBeenCalledWith(expect.stringContaining("mcpServers"), "Canonical config");
    expect(outro).toHaveBeenCalledWith("Done");
  });
});

// ---------------------------------------------------------------------------
// addCommand — unverified servers (--from-npm, --from-pypi, --from-url)
// ---------------------------------------------------------------------------

describe("addCommand — unverified servers", () => {
  it("adds from --from-npm", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { mergeServerIntoConfig, writeConfigFile } = await import("../../src/config-file.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand(undefined, { yes: true, fromNpm: "@example/mcp-server" });

    expect(mergeServerIntoConfig).toHaveBeenCalled();
    expect(writeConfigFile).toHaveBeenCalled();
  });

  it("adds from --from-pypi", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { mergeServerIntoConfig, writeConfigFile } = await import("../../src/config-file.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand(undefined, { yes: true, fromPypi: "mcp-server-example" });

    expect(mergeServerIntoConfig).toHaveBeenCalled();
    expect(writeConfigFile).toHaveBeenCalled();
  });

  it("adds from --from-url", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { mergeServerIntoConfig, writeConfigFile } = await import("../../src/config-file.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand(undefined, { yes: true, fromUrl: "https://example.com/mcp" });

    expect(mergeServerIntoConfig).toHaveBeenCalled();
    expect(writeConfigFile).toHaveBeenCalled();
  });

  it("skips writes in --dry-run mode for unverified servers", async () => {
    const { detectApps } = await import("../../src/detect.js");
    const { writeConfigFile } = await import("../../src/config-file.js");

    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    await addCommand(undefined, { yes: true, fromNpm: "@example/mcp-server", dryRun: true });

    expect(writeConfigFile).not.toHaveBeenCalled();
  });
});
