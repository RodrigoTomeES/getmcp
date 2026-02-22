import { describe, it, expect } from "vitest";
import { parseFlags, resolveAlias } from "../src/utils.js";

// ---------------------------------------------------------------------------
// parseFlags — bin-level integration tests
// ---------------------------------------------------------------------------

describe("parseFlags (bin-level)", () => {
  it("returns help flag with --help", () => {
    const result = parseFlags(["--help"]);
    expect(result.flags.help).toBe(true);
  });

  it("returns version flag with -v", () => {
    const result = parseFlags(["-v"]);
    expect(result.flags.version).toBe(true);
  });

  it("handles unknown flags gracefully", () => {
    const result = parseFlags(["list", "--unknown-flag"]);
    expect(result.command).toBe("list");
    // Unknown flags are silently ignored; base flags remain defaults
    expect(result.flags.help).toBe(false);
    expect(result.flags.version).toBe(false);
  });

  it("parses command with multiple known and unknown flags", () => {
    const result = parseFlags(["add", "github", "--unknown", "--yes", "--dry-run"]);
    expect(result.command).toBe("add");
    expect(result.serverId).toBe("github");
    expect(result.flags.yes).toBe(true);
    expect(result.flags.dryRun).toBe(true);
  });

  it("returns no command when only flags are provided", () => {
    const result = parseFlags(["--version"]);
    expect(result.command).toBeUndefined();
    expect(result.flags.version).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveAlias — comprehensive alias mapping
// ---------------------------------------------------------------------------

describe("resolveAlias (bin-level)", () => {
  it("maps install to add", () => {
    expect(resolveAlias("install")).toBe("add");
  });

  it("maps rm to remove", () => {
    expect(resolveAlias("rm")).toBe("remove");
  });

  it("maps ls to list", () => {
    expect(resolveAlias("ls")).toBe("list");
  });

  it("maps s to find", () => {
    expect(resolveAlias("s")).toBe("find");
  });

  it("maps f to find", () => {
    expect(resolveAlias("f")).toBe("find");
  });

  it("returns undefined for unknown command", () => {
    expect(resolveAlias("unknown")).toBeUndefined();
  });

  it("returns undefined for empty-like strings", () => {
    expect(resolveAlias("")).toBeUndefined();
  });
});
