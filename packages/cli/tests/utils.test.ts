import { describe, it, expect } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { shortenPath, parseFlags, resolveAlias } from "../src/utils.js";

// ---------------------------------------------------------------------------
// shortenPath
// ---------------------------------------------------------------------------

describe("shortenPath", () => {
  it("replaces home directory with ~", () => {
    const home = os.homedir();
    const filePath = path.join(home, "some", "config.json");
    const result = shortenPath(filePath);
    expect(result).toMatch(/^~/);
    expect(result).toContain("some");
    expect(result).toContain("config.json");
    expect(result).not.toContain(home);
  });

  it("replaces CWD with .", () => {
    const cwd = process.cwd();
    const filePath = path.join(cwd, "local.json");
    const result = shortenPath(filePath);
    expect(result).toMatch(/^\./);
    expect(result).toContain("local.json");
  });

  it("prefers CWD over home when CWD is inside home", () => {
    const cwd = process.cwd();
    // Only test if CWD is inside home (which is the common case)
    if (cwd.startsWith(os.homedir())) {
      const filePath = path.join(cwd, "test.json");
      const result = shortenPath(filePath);
      // Should start with . not ~ because CWD is more specific
      expect(result).toMatch(/^\./);
    }
  });

  it("returns path unchanged if not under home or cwd", () => {
    // Use a path that's unlikely to be anyone's home or cwd
    const fakePath = path.normalize("/unlikely/test/path/config.json");
    const result = shortenPath(fakePath);
    expect(result).toBe(fakePath);
  });
});

// ---------------------------------------------------------------------------
// parseFlags
// ---------------------------------------------------------------------------

describe("parseFlags", () => {
  it("parses command and server ID", () => {
    const result = parseFlags(["add", "github"]);
    expect(result.command).toBe("add");
    expect(result.serverId).toBe("github");
  });

  it("parses --yes flag", () => {
    const result = parseFlags(["add", "github", "--yes"]);
    expect(result.flags.yes).toBe(true);
  });

  it("parses -y short flag", () => {
    const result = parseFlags(["add", "github", "-y"]);
    expect(result.flags.yes).toBe(true);
  });

  it("parses --app flag with space-separated value", () => {
    const result = parseFlags(["add", "github", "--app", "vscode"]);
    expect(result.flags.apps).toEqual(["vscode"]);
  });

  it("parses --app= flag with equals-separated value", () => {
    const result = parseFlags(["add", "github", "--app=vscode"]);
    expect(result.flags.apps).toEqual(["vscode"]);
  });

  it("parses multiple --app flags", () => {
    const result = parseFlags(["add", "github", "--app", "vscode", "--app", "cursor"]);
    expect(result.flags.apps).toEqual(["vscode", "cursor"]);
  });

  it("parses --all-apps flag", () => {
    const result = parseFlags(["add", "github", "--all-apps"]);
    expect(result.flags.allApps).toBe(true);
  });

  it("parses --dry-run flag", () => {
    const result = parseFlags(["add", "github", "--dry-run"]);
    expect(result.flags.dryRun).toBe(true);
  });

  it("parses --installed flag", () => {
    const result = parseFlags(["list", "--installed"]);
    expect(result.flags.installed).toBe(true);
  });

  it("parses --search= flag", () => {
    const result = parseFlags(["list", "--search=database"]);
    expect(result.flags.search).toBe("database");
  });

  it("parses --category= flag", () => {
    const result = parseFlags(["list", "--category=web"]);
    expect(result.flags.category).toBe("web");
  });

  it("parses --help flag", () => {
    const result = parseFlags(["--help"]);
    expect(result.flags.help).toBe(true);
  });

  it("parses -h short flag", () => {
    const result = parseFlags(["-h"]);
    expect(result.flags.help).toBe(true);
  });

  it("parses --version flag", () => {
    const result = parseFlags(["--version"]);
    expect(result.flags.version).toBe(true);
  });

  it("parses -v short flag", () => {
    const result = parseFlags(["-v"]);
    expect(result.flags.version).toBe(true);
  });

  it("handles empty args", () => {
    const result = parseFlags([]);
    expect(result.command).toBeUndefined();
    expect(result.serverId).toBeUndefined();
    expect(result.flags.yes).toBe(false);
  });

  it("ignores unknown flags", () => {
    const result = parseFlags(["add", "--unknown"]);
    expect(result.command).toBe("add");
  });

  it("combines multiple flags", () => {
    const result = parseFlags(["add", "github", "-y", "--app", "vscode", "--dry-run"]);
    expect(result.command).toBe("add");
    expect(result.serverId).toBe("github");
    expect(result.flags.yes).toBe(true);
    expect(result.flags.apps).toEqual(["vscode"]);
    expect(result.flags.dryRun).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveAlias
// ---------------------------------------------------------------------------

describe("resolveAlias", () => {
  it("resolves 'add' to 'add'", () => {
    expect(resolveAlias("add")).toBe("add");
  });

  it("resolves 'install' to 'add'", () => {
    expect(resolveAlias("install")).toBe("add");
  });

  it("resolves 'i' to 'add'", () => {
    expect(resolveAlias("i")).toBe("add");
  });

  it("resolves 'remove' to 'remove'", () => {
    expect(resolveAlias("remove")).toBe("remove");
  });

  it("resolves 'rm' to 'remove'", () => {
    expect(resolveAlias("rm")).toBe("remove");
  });

  it("resolves 'r' to 'remove'", () => {
    expect(resolveAlias("r")).toBe("remove");
  });

  it("resolves 'uninstall' to 'remove'", () => {
    expect(resolveAlias("uninstall")).toBe("remove");
  });

  it("resolves 'list' to 'list'", () => {
    expect(resolveAlias("list")).toBe("list");
  });

  it("resolves 'ls' to 'list'", () => {
    expect(resolveAlias("ls")).toBe("list");
  });

  it("resolves 'find' to 'find'", () => {
    expect(resolveAlias("find")).toBe("find");
  });

  it("resolves 'search' to 'find'", () => {
    expect(resolveAlias("search")).toBe("find");
  });

  it("resolves 's' to 'find'", () => {
    expect(resolveAlias("s")).toBe("find");
  });

  it("resolves 'f' to 'find'", () => {
    expect(resolveAlias("f")).toBe("find");
  });

  it("resolves 'check' to 'check'", () => {
    expect(resolveAlias("check")).toBe("check");
  });

  it("resolves 'update' to 'update'", () => {
    expect(resolveAlias("update")).toBe("update");
  });

  it("resolves 'init' to 'init'", () => {
    expect(resolveAlias("init")).toBe("init");
  });

  it("returns undefined for unknown command", () => {
    expect(resolveAlias("foobar")).toBeUndefined();
  });
});
