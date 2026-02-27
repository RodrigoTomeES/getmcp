import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findCommand } from "../../src/commands/find.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn(), step: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  select: vi.fn(),
  text: vi.fn(() => ""),
  isCancel: vi.fn(() => false),
}));

// Mock the add command to prevent it from executing
vi.mock("../../src/commands/add.js", () => ({
  addCommand: vi.fn(),
}));

// Mock detectApps (needed by addCommand, but we mock addCommand itself)
vi.mock("../../src/detect.js", () => ({
  detectApps: vi.fn(() => []),
}));

// Mock config-file (needed by addCommand)
vi.mock("../../src/config-file.js", () => ({
  mergeServerIntoConfig: vi.fn(() => ({})),
  writeConfigFile: vi.fn(),
}));

// Mock lock file (needed by addCommand)
vi.mock("../../src/lock.js", () => ({
  trackInstallation: vi.fn(),
}));

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
// findCommand
// ---------------------------------------------------------------------------

describe("findCommand", () => {
  it("warns when no matches for initial query and retry also fails", async () => {
    const p = await import("@clack/prompts");
    // First search "zzznonexistentzzz" finds nothing, prompts for retry
    // Retry with another non-matching term also finds nothing
    (p.text as ReturnType<typeof vi.fn>).mockResolvedValueOnce("zzzalsonotfoundzzz");

    await findCommand("zzznonexistentzzz");

    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('No servers matching "zzznonexistentzzz"'),
    );
    expect(p.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('No servers matching "zzzalsonotfoundzzz"'),
    );
  });

  it("shows search results and jumps to add flow on selection", async () => {
    const p = await import("@clack/prompts");
    const { addCommand } = await import("../../src/commands/add.js");

    // Mock select to return a server
    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "github",
      name: "GitHub",
      description: "GitHub MCP Server",
      config: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
      requiredEnvVars: [],
      categories: [],
    });

    await findCommand("github");

    expect(p.select).toHaveBeenCalled();
    expect(addCommand).toHaveBeenCalledWith("github", expect.objectContaining({}));
  });

  it("prompts for search term when no initial query provided", async () => {
    const p = await import("@clack/prompts");
    const { addCommand } = await import("../../src/commands/add.js");

    // Mock text to return a search term
    (p.text as ReturnType<typeof vi.fn>).mockResolvedValueOnce("github");

    // Mock select to return a server
    (p.select as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "github",
      name: "GitHub",
      description: "GitHub MCP Server",
      config: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
      requiredEnvVars: [],
      categories: [],
    });

    await findCommand();

    expect(p.text).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Search") }),
    );
    expect(addCommand).toHaveBeenCalledWith("github", expect.objectContaining({}));
  });
});
