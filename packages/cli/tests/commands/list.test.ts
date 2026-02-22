import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listCommand } from "../../src/commands/list.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn() },
}));

// Mock detectInstalledApps to avoid filesystem access
vi.mock("../../src/detect.js", () => ({
  detectInstalledApps: vi.fn(() => []),
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
// listCommand
// ---------------------------------------------------------------------------

describe("listCommand", () => {
  it("lists all servers without options", async () => {
    await listCommand({});

    expect(consoleSpy).toHaveBeenCalled();

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    // The registry contains a "github" server, so it should appear in the output
    expect(output.toLowerCase()).toContain("github");
  });

  it("searches servers by query", async () => {
    await listCommand({ search: "database" });

    expect(consoleSpy).toHaveBeenCalled();

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    // The postgres server description contains "database"
    expect(output.toLowerCase()).toContain("postgres");
  });

  it("filters by category", async () => {
    await listCommand({ category: "search" });

    expect(consoleSpy).toHaveBeenCalled();

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    // brave-search is in the "search" category
    expect(output.toLowerCase()).toContain("brave");
  });

  it("shows warning for empty search results", async () => {
    const { log } = await import("@clack/prompts");

    await listCommand({ search: "xyznonexistent" });

    expect(log.warn).toHaveBeenCalled();
    const warningArg = (log.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(warningArg).toContain("xyznonexistent");
  });

  it("shows warning for invalid category", async () => {
    const { log } = await import("@clack/prompts");

    await listCommand({ category: "nonexistent" });

    expect(log.warn).toHaveBeenCalled();
    const warningArg = (log.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(warningArg).toContain("nonexistent");

    // Should also show available categories
    expect(log.info).toHaveBeenCalled();
    const infoArg = (log.info as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(infoArg).toContain("Available categories");
  });

  it("lists installed servers mode", async () => {
    // With detectInstalledApps mocked to return [], it should warn
    const { log } = await import("@clack/prompts");

    await listCommand({ installed: true });

    expect(log.warn).toHaveBeenCalled();
    const warningArg = (log.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(warningArg).toContain("No AI applications detected");
  });
});
