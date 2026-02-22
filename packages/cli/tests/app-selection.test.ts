import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveAppsFromFlags, resolveScope } from "../src/app-selection.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
  select: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// Mock detectApps
vi.mock("../src/detect.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/detect.js")>();
  return {
    ...actual,
    detectApps: vi.fn(() => []),
    resolveAppForScope: actual.resolveAppForScope,
  };
});

let exitSpy: ReturnType<typeof vi.spyOn>;

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

beforeEach(() => {
  exitSpy = vi.spyOn(process, "exit").mockImplementation(((code: number) => {
    throw new ExitError(code);
  }) as never);
});

afterEach(() => {
  exitSpy.mockRestore();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// resolveAppsFromFlags
// ---------------------------------------------------------------------------

describe("resolveAppsFromFlags", () => {
  it("returns detected apps by default", async () => {
    const { detectApps } = await import("../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ]);

    const result = resolveAppsFromFlags({});
    expect(result).not.toBeNull();
    expect(result!.apps).toHaveLength(1);
    expect(result!.apps[0].id).toBe("claude-desktop");
  });

  it("returns null when --all-apps but none detected", async () => {
    const { detectApps } = await import("../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: false,
        supportsBothScopes: false,
      },
    ]);

    const result = resolveAppsFromFlags({ allApps: true });
    expect(result).toBeNull();
  });

  it("returns all detected apps with --all-apps", async () => {
    const { detectApps } = await import("../src/detect.js");
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

    const result = resolveAppsFromFlags({ allApps: true });
    expect(result).not.toBeNull();
    expect(result!.apps).toHaveLength(2);
  });

  it("filters by --app flag", async () => {
    const { detectApps } = await import("../src/detect.js");
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

    const result = resolveAppsFromFlags({ apps: ["cursor"] });
    expect(result).not.toBeNull();
    expect(result!.apps).toHaveLength(1);
    expect(result!.apps[0].id).toBe("cursor");
  });

  it("exits on invalid --app ID", async () => {
    const { detectApps } = await import("../src/detect.js");
    (detectApps as ReturnType<typeof vi.fn>).mockReturnValue([]);

    expect(() => resolveAppsFromFlags({ apps: ["invalid-app-xyz"] })).toThrow(ExitError);
  });
});

// ---------------------------------------------------------------------------
// resolveScope
// ---------------------------------------------------------------------------

describe("resolveScope", () => {
  it("returns apps unchanged and scope 'project' when none are dual-scope", async () => {
    const apps = [
      {
        id: "claude-desktop" as const,
        name: "Claude Desktop",
        configPath: "/tmp/config.json",
        exists: true,
        supportsBothScopes: false,
      },
    ];

    const result = await resolveScope(apps, {}, true);
    expect(result.apps).toEqual(apps);
    expect(result.scope).toBe("project");
  });

  it("uses --global flag for dual-scope apps and returns scope 'global'", async () => {
    const apps = [
      {
        id: "claude-code" as const,
        name: "Claude Code",
        configPath: ".mcp.json",
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: "/home/.claude.json",
      },
    ];

    const result = await resolveScope(apps, { global: true }, true);
    expect(result.apps[0].configPath).toBe("/home/.claude.json");
    expect(result.scope).toBe("global");
  });

  it("defaults to project scope in non-interactive mode", async () => {
    const apps = [
      {
        id: "claude-code" as const,
        name: "Claude Code",
        configPath: ".mcp.json",
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: "/home/.claude.json",
      },
    ];

    const result = await resolveScope(apps, {}, true);
    expect(result.apps[0].configPath).toBe(".mcp.json");
    expect(result.scope).toBe("project");
  });

  it("uses --project flag for dual-scope apps and returns scope 'project'", async () => {
    const apps = [
      {
        id: "claude-code" as const,
        name: "Claude Code",
        configPath: ".mcp.json",
        exists: true,
        supportsBothScopes: true,
        globalConfigPath: "/home/.claude.json",
      },
    ];

    const result = await resolveScope(apps, { project: true }, true);
    expect(result.apps[0].configPath).toBe(".mcp.json");
    expect(result.scope).toBe("project");
  });
});
