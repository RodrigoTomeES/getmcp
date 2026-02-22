import { describe, it, expect } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { resolvePath, detectApps } from "../src/detect.js";
import { generators } from "@getmcp/generators";

describe("resolvePath", () => {
  it("expands ~ to home directory", () => {
    const result = resolvePath("~/test/path");
    expect(result).toBe(path.normalize(path.join(os.homedir(), "test", "path")));
  });

  it.skipIf(process.platform !== "win32")("expands %AppData%", () => {
    const result = resolvePath("%AppData%\\test");
    const expected = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    expect(result).toBe(path.normalize(path.join(expected, "test")));
  });

  it.skipIf(process.platform !== "win32")("expands %UserProfile%", () => {
    const result = resolvePath("%UserProfile%\\test");
    expect(result).toBe(path.normalize(path.join(os.homedir(), "test")));
  });

  it("returns relative paths normalized", () => {
    const result = resolvePath(".mcp.json");
    expect(result).toBe(path.normalize(".mcp.json"));
  });
});

describe("detectApps", () => {
  it("returns an array of apps", () => {
    const apps = detectApps();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThan(0);
  });

  it("each app has required fields", () => {
    const apps = detectApps();
    for (const app of apps) {
      expect(app.id).toBeDefined();
      expect(app.name).toBeDefined();
      expect(app.configPath).toBeDefined();
      expect(typeof app.exists).toBe("boolean");
      expect(["project", "global"]).toContain(app.scope);
    }
  });

  it("includes known apps for this platform", () => {
    const apps = detectApps();
    const ids = apps.map((a) => a.id);
    // These should always have config paths regardless of platform
    expect(ids).toContain("claude-code"); // .mcp.json - relative
    expect(ids).toContain("opencode"); // opencode.json - relative
  });

  it("project-scoped apps have scope 'project'", () => {
    const apps = detectApps();
    const projectIds = ["claude-code", "vscode", "cursor", "opencode", "pycharm"];
    for (const app of apps) {
      if (projectIds.includes(app.id)) {
        expect(app.scope).toBe("project");
      }
    }
  });

  it("global-scoped apps have scope 'global'", () => {
    const apps = detectApps();
    const globalIds = ["claude-desktop", "cline", "roo-code", "goose", "windsurf", "zed", "codex"];
    for (const app of apps) {
      if (globalIds.includes(app.id)) {
        expect(app.scope).toBe("global");
      }
    }
  });

  it("exists field reflects generator.detectInstalled()", () => {
    const apps = detectApps();
    for (const app of apps) {
      const generator = generators[app.id];
      expect(app.exists).toBe(generator.detectInstalled());
    }
  });
});
