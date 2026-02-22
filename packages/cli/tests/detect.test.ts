import { describe, it, expect } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { resolvePath, detectApps, resolveAppForScope } from "../src/detect.js";
import { generators } from "@getmcp/generators";
import { supportsBothScopes } from "@getmcp/core";

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
      expect(typeof app.supportsBothScopes).toBe("boolean");
    }
  });

  it("includes known apps for this platform", () => {
    const apps = detectApps();
    const ids = apps.map((a) => a.id);
    // These should always have config paths regardless of platform
    expect(ids).toContain("claude-code"); // .mcp.json - relative
    expect(ids).toContain("opencode"); // opencode.json - relative
  });

  it("dual-scope apps have supportsBothScopes true", () => {
    const apps = detectApps();
    const dualScopeIds = ["claude-code", "cursor", "codex"];
    for (const app of apps) {
      if (dualScopeIds.includes(app.id)) {
        expect(app.supportsBothScopes).toBe(true);
        expect(app.globalConfigPath).toBeDefined();
      }
    }
  });

  it("single-scope apps have supportsBothScopes false", () => {
    const apps = detectApps();
    const singleScopeIds = ["claude-desktop", "vscode", "cline", "goose", "opencode"];
    for (const app of apps) {
      if (singleScopeIds.includes(app.id)) {
        expect(app.supportsBothScopes).toBe(false);
        expect(app.globalConfigPath).toBeUndefined();
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

  it("supportsBothScopes matches core utility", () => {
    const apps = detectApps();
    for (const app of apps) {
      const generator = generators[app.id];
      expect(app.supportsBothScopes).toBe(supportsBothScopes(generator.app));
    }
  });
});

describe("resolveAppForScope", () => {
  it("returns unchanged app for single-scope apps", () => {
    const app = {
      id: "vscode" as const,
      name: "VS Code",
      configPath: ".vscode/mcp.json",
      exists: true,
      supportsBothScopes: false,
    };
    const resolved = resolveAppForScope(app, "global");
    expect(resolved).toBe(app); // same reference, unchanged
  });

  it("swaps configPath for dual-scope app with global scope", () => {
    const app = {
      id: "claude-code" as const,
      name: "Claude Code",
      configPath: ".mcp.json",
      exists: true,
      supportsBothScopes: true,
      globalConfigPath: "/home/user/.claude.json",
    };
    const resolved = resolveAppForScope(app, "global");
    expect(resolved.configPath).toBe("/home/user/.claude.json");
  });

  it("keeps default configPath for dual-scope app with project scope", () => {
    const app = {
      id: "claude-code" as const,
      name: "Claude Code",
      configPath: ".mcp.json",
      exists: true,
      supportsBothScopes: true,
      globalConfigPath: "/home/user/.claude.json",
    };
    const resolved = resolveAppForScope(app, "project");
    expect(resolved.configPath).toBe(".mcp.json");
  });
});
