import { describe, it, expect } from "vitest";
import {
  CliError,
  ConfigParseError,
  AppNotDetectedError,
  InvalidAppError,
  ServerNotFoundError,
  NonInteractiveError,
  formatError,
} from "../src/errors.js";

// ---------------------------------------------------------------------------
// CliError
// ---------------------------------------------------------------------------

describe("CliError", () => {
  it("stores message and remediation", () => {
    const err = new CliError("something failed", "try again");
    expect(err.message).toBe("something failed");
    expect(err.remediation).toBe("try again");
  });

  it("format() includes both message and remediation", () => {
    const err = new CliError("something failed", "try again");
    const formatted = err.format();
    expect(formatted).toContain("something failed");
    expect(formatted).toContain("try again");
  });

  it("is an instance of Error", () => {
    const err = new CliError("test", "hint");
    expect(err).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// ConfigParseError
// ---------------------------------------------------------------------------

describe("ConfigParseError", () => {
  it("includes file path in message", () => {
    const err = new ConfigParseError("/path/to/config.json");
    expect(err.message).toContain("/path/to/config.json");
    expect(err.filePath).toBe("/path/to/config.json");
  });

  it("includes cause when provided", () => {
    const err = new ConfigParseError("/path/config.json", "Unexpected token");
    expect(err.message).toContain("Unexpected token");
  });

  it("provides actionable remediation", () => {
    const err = new ConfigParseError("/path/config.json");
    expect(err.remediation).toContain("syntax errors");
  });
});

// ---------------------------------------------------------------------------
// AppNotDetectedError
// ---------------------------------------------------------------------------

describe("AppNotDetectedError", () => {
  it("has appropriate message", () => {
    const err = new AppNotDetectedError();
    expect(err.message).toContain("No AI applications detected");
  });

  it("suggests --app flag in remediation", () => {
    const err = new AppNotDetectedError();
    expect(err.remediation).toContain("--app");
  });
});

// ---------------------------------------------------------------------------
// InvalidAppError
// ---------------------------------------------------------------------------

describe("InvalidAppError", () => {
  it("includes the invalid app ID", () => {
    const err = new InvalidAppError("foobar", ["claude-desktop", "vscode"]);
    expect(err.message).toContain("foobar");
    expect(err.appId).toBe("foobar");
  });

  it("lists valid IDs in remediation", () => {
    const err = new InvalidAppError("foobar", ["claude-desktop", "vscode"]);
    expect(err.remediation).toContain("claude-desktop");
    expect(err.remediation).toContain("vscode");
  });
});

// ---------------------------------------------------------------------------
// ServerNotFoundError
// ---------------------------------------------------------------------------

describe("ServerNotFoundError", () => {
  it("includes server ID", () => {
    const err = new ServerNotFoundError("nonexistent");
    expect(err.message).toContain("nonexistent");
    expect(err.serverId).toBe("nonexistent");
  });

  it("suggests list and find commands", () => {
    const err = new ServerNotFoundError("test");
    expect(err.remediation).toContain("getmcp list");
    expect(err.remediation).toContain("getmcp find");
  });
});

// ---------------------------------------------------------------------------
// NonInteractiveError
// ---------------------------------------------------------------------------

describe("NonInteractiveError", () => {
  it("includes detail about what's needed", () => {
    const err = new NonInteractiveError("server ID is required");
    expect(err.message).toContain("server ID is required");
  });

  it("suggests --help in remediation", () => {
    const err = new NonInteractiveError("something");
    expect(err.remediation).toContain("getmcp --help");
  });
});

// ---------------------------------------------------------------------------
// formatError
// ---------------------------------------------------------------------------

describe("formatError", () => {
  it("formats CliError with remediation", () => {
    const err = new CliError("fail", "do this instead");
    const result = formatError(err);
    expect(result).toContain("fail");
    expect(result).toContain("do this instead");
  });

  it("formats regular Error", () => {
    const err = new Error("something broke");
    expect(formatError(err)).toBe("something broke");
  });

  it("formats strings", () => {
    expect(formatError("raw string error")).toBe("raw string error");
  });

  it("formats non-error objects", () => {
    expect(formatError(42)).toBe("42");
  });
});
