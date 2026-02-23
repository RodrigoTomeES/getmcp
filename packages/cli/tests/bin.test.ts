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

  it("parses --json flag", () => {
    const result = parseFlags(["list", "--json"]);
    expect(result.command).toBe("list");
    expect(result.flags.json).toBe(true);
  });

  it("parses --quiet flag", () => {
    const result = parseFlags(["list", "--quiet"]);
    expect(result.command).toBe("list");
    expect(result.flags.quiet).toBe(true);
  });

  it("parses -q shorthand for --quiet", () => {
    const result = parseFlags(["list", "-q"]);
    expect(result.command).toBe("list");
    expect(result.flags.quiet).toBe(true);
  });

  it("parses --json and --quiet together", () => {
    const result = parseFlags(["list", "--json", "-q"]);
    expect(result.flags.json).toBe(true);
    expect(result.flags.quiet).toBe(true);
  });

  it("parses --from-npm with = syntax", () => {
    const result = parseFlags(["add", "--from-npm=@some/pkg"]);
    expect(result.command).toBe("add");
    expect(result.flags.fromNpm).toBe("@some/pkg");
  });

  it("parses --from-npm with space syntax", () => {
    const result = parseFlags(["add", "--from-npm", "@some/pkg"]);
    expect(result.flags.fromNpm).toBe("@some/pkg");
  });

  it("parses --from-pypi", () => {
    const result = parseFlags(["add", "--from-pypi=some-pkg"]);
    expect(result.flags.fromPypi).toBe("some-pkg");
  });

  it("parses --from-url", () => {
    const result = parseFlags(["add", "--from-url=https://mcp.example.com/sse"]);
    expect(result.flags.fromUrl).toBe("https://mcp.example.com/sse");
  });

  it("parses --output with space syntax", () => {
    const result = parseFlags(["init", "--output", "/some/dir"]);
    expect(result.flags.output).toBe("/some/dir");
  });

  it("parses --output with = syntax", () => {
    const result = parseFlags(["init", "--output=/some/dir"]);
    expect(result.flags.output).toBe("/some/dir");
  });

  it("parses -o shorthand for --output", () => {
    const result = parseFlags(["init", "-o", "/some/dir"]);
    expect(result.flags.output).toBe("/some/dir");
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

  it("maps dr to doctor", () => {
    expect(resolveAlias("dr")).toBe("doctor");
  });

  it("maps doctor to doctor", () => {
    expect(resolveAlias("doctor")).toBe("doctor");
  });
});
