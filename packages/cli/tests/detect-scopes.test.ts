/**
 * Filesystem-sensitive scope resolution tests.
 *
 * Kept apart from detect.test.ts because these swap HOME/XDG_CONFIG_HOME and
 * the working directory, which must not leak into the other suites.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  resolvePath,
  detectApps,
  resolveAppForScope,
  getReadableConfigPaths,
} from "../src/detect.js";

let tmpRoot: string;
let fakeHome: string;
let projectDir: string;
let originalCwd: string;

// Restore keys individually — assigning to `process.env` wholesale replaces
// the native-backed object with a plain one, after which os.homedir() stops
// seeing updates.
const PATCHED_VARS = ["HOME", "USERPROFILE", "XDG_CONFIG_HOME"] as const;
let savedEnv: Record<string, string | undefined> = {};

/** Point HOME/USERPROFILE at a scratch dir and cd into an empty project. */
beforeEach(() => {
  originalCwd = process.cwd();
  savedEnv = Object.fromEntries(PATCHED_VARS.map((key) => [key, process.env[key]]));

  tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-scopes-")));
  fakeHome = path.join(tmpRoot, "home");
  projectDir = path.join(tmpRoot, "project");
  fs.mkdirSync(fakeHome, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  process.env.HOME = fakeHome;
  process.env.USERPROFILE = fakeHome;
  delete process.env.XDG_CONFIG_HOME;
  process.chdir(projectDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  for (const key of PATCHED_VARS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function write(filePath: string, contents: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(contents, null, 2));
}

function findApp(id: string) {
  const app = detectApps().find((a) => a.id === id);
  if (!app) throw new Error(`app ${id} not detected`);
  return app;
}

describe("resolvePath — %XDGConfigHome%", () => {
  it("expands to XDG_CONFIG_HOME when set", () => {
    process.env.XDG_CONFIG_HOME = path.join(fakeHome, "xdg");
    expect(resolvePath("%XDGConfigHome%/opencode/opencode.json")).toBe(
      path.normalize(path.join(fakeHome, "xdg", "opencode", "opencode.json")),
    );
  });

  it("falls back to ~/.config when XDG_CONFIG_HOME is unset", () => {
    expect(resolvePath("%XDGConfigHome%/opencode/opencode.json")).toBe(
      path.normalize(path.join(os.homedir(), ".config", "opencode", "opencode.json")),
    );
  });

  it("ignores a whitespace-only XDG_CONFIG_HOME", () => {
    process.env.XDG_CONFIG_HOME = "   ";
    expect(resolvePath("%XDGConfigHome%/opencode")).toBe(
      path.normalize(path.join(os.homedir(), ".config", "opencode")),
    );
  });
});

describe("detectApps — project scope is never redirected to global", () => {
  // Regression guard: a fallback that rewrote configPath to the global file
  // when the project file was absent leaked into add/sync/update/remove,
  // because resolveAppForScope(app, "project") does not restore the project
  // path. Project-scoped writes must never target the home directory.
  it("keeps the project path when only the global config exists", () => {
    write(path.join(fakeHome, ".cursor", "mcp.json"), {
      mcpServers: { "global-only": { command: "node" } },
    });

    const cursor = findApp("cursor");
    expect(cursor.configPath).toBe(".cursor/mcp.json");
    expect(resolveAppForScope(cursor, "project").configPath).toBe(".cursor/mcp.json");
  });

  it("still resolves the global path on request", () => {
    const cursor = findApp("cursor");
    expect(resolveAppForScope(cursor, "global").configPath).toBe(
      path.normalize(path.join(fakeHome, ".cursor", "mcp.json")),
    );
  });
});

describe("getReadableConfigPaths", () => {
  it("returns nothing when no config exists", () => {
    expect(getReadableConfigPaths(findApp("opencode"))).toEqual([]);
  });

  it("finds a global-only config (the OpenCode doctor bug)", () => {
    const globalConfig = path.join(fakeHome, ".config", "opencode", "opencode.json");
    write(globalConfig, { mcp: { exa: { type: "local", command: ["npx", "exa"] } } });

    expect(getReadableConfigPaths(findApp("opencode"))).toEqual([
      { scope: "global", path: path.normalize(globalConfig) },
    ]);
  });

  it("probes the .jsonc sibling for jsonc-format apps", () => {
    const globalConfig = path.join(fakeHome, ".config", "opencode", "opencode.jsonc");
    write(globalConfig, { mcp: {} });

    expect(getReadableConfigPaths(findApp("opencode"))).toEqual([
      { scope: "global", path: path.normalize(globalConfig) },
    ]);
  });

  it("prefers .json over .jsonc when both exist, matching OpenCode", () => {
    const dir = path.join(fakeHome, ".config", "opencode");
    write(path.join(dir, "opencode.json"), { mcp: {} });
    write(path.join(dir, "opencode.jsonc"), { mcp: {} });

    const found = getReadableConfigPaths(findApp("opencode"));
    expect(found).toHaveLength(1);
    expect(found[0]!.path).toBe(path.normalize(path.join(dir, "opencode.json")));
  });

  it("returns both scopes, project first, when both exist", () => {
    write(path.join(projectDir, "opencode.json"), { mcp: {} });
    const globalConfig = path.join(fakeHome, ".config", "opencode", "opencode.json");
    write(globalConfig, { mcp: {} });

    expect(getReadableConfigPaths(findApp("opencode"))).toEqual([
      { scope: "project", path: "opencode.json" },
      { scope: "global", path: path.normalize(globalConfig) },
    ]);
  });

  it("honours XDG_CONFIG_HOME for OpenCode's global config", () => {
    process.env.XDG_CONFIG_HOME = path.join(tmpRoot, "xdg");
    const globalConfig = path.join(tmpRoot, "xdg", "opencode", "opencode.json");
    write(globalConfig, { mcp: {} });

    expect(getReadableConfigPaths(findApp("opencode"))).toEqual([
      { scope: "global", path: path.normalize(globalConfig) },
    ]);
  });

  it("only considers the project scope for single-scope apps", () => {
    write(path.join(projectDir, ".vscode", "mcp.json"), { servers: {} });

    const found = getReadableConfigPaths(findApp("vscode"));
    expect(found).toEqual([{ scope: "project", path: ".vscode/mcp.json" }]);
  });

  it("does not probe siblings for non-jsonc apps", () => {
    // Cursor is plain JSON; a stray .jsonc must not be picked up
    write(path.join(fakeHome, ".cursor", "mcp.jsonc"), { mcpServers: {} });

    expect(getReadableConfigPaths(findApp("cursor"))).toEqual([]);
  });
});
