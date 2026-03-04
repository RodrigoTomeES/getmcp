import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  readLockFile,
  writeLockFile,
  trackInstallation,
  trackRemoval,
  getTrackedServers,
} from "../src/lock.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-lock-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function tmpFile(name: string): string {
  return path.join(tmpDir, name);
}

// ---------------------------------------------------------------------------
// readLockFile
// ---------------------------------------------------------------------------

describe("readLockFile", () => {
  it("returns empty lock for non-existent file", () => {
    const lock = readLockFile(tmpFile("missing.json"));
    expect(lock).toEqual({ version: 2, installations: {} });
  });

  it("returns empty lock for empty file", () => {
    const f = tmpFile("empty.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(readLockFile(f)).toEqual({ version: 2, installations: {} });
  });

  it("returns empty lock for invalid JSON", () => {
    const f = tmpFile("invalid.json");
    fs.writeFileSync(f, "not json", "utf-8");
    expect(readLockFile(f)).toEqual({ version: 2, installations: {} });
  });

  it("returns empty lock for wrong version", () => {
    const f = tmpFile("wrong-version.json");
    fs.writeFileSync(f, JSON.stringify({ version: 99 }), "utf-8");
    expect(readLockFile(f)).toEqual({ version: 2, installations: {} });
  });

  it("reads valid v2 lock file", () => {
    const f = tmpFile("valid.json");
    const lock = {
      version: 2,
      installations: {
        "io.github.test/github-server": {
          apps: ["claude-desktop"],
          installedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          envVars: ["GITHUB_TOKEN"],
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(lock), "utf-8");
    expect(readLockFile(f)).toEqual(lock);
  });

  it("returns empty lock for structurally invalid data (Zod validation)", () => {
    const f = tmpFile("bad-structure.json");
    // version is correct but installations has wrong shape
    const bad = {
      version: 2,
      installations: {
        github: {
          apps: "not-an-array",
          installedAt: 12345,
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(bad), "utf-8");
    expect(readLockFile(f)).toEqual({ version: 2, installations: {} });
  });
});

// ---------------------------------------------------------------------------
// v1 → v2 migration
// ---------------------------------------------------------------------------

describe("readLockFile — v1 → v2 migration", () => {
  it("migrates v1 lock file to v2 on read", () => {
    const f = tmpFile("v1.json");
    const v1Lock = {
      version: 1,
      installations: {
        "github-github": {
          apps: ["claude-desktop"],
          installedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          envVars: ["GITHUB_TOKEN"],
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(v1Lock), "utf-8");

    const resolver = (slug: string) =>
      slug === "github-github" ? "io.github.github/github-mcp-server" : undefined;

    const lock = readLockFile(f, resolver);
    expect(lock.version).toBe(2);
    expect(lock.installations["io.github.github/github-mcp-server"]).toBeDefined();
    expect(lock.installations["io.github.github/github-mcp-server"].apps).toEqual([
      "claude-desktop",
    ]);
    expect(lock.installations["github-github"]).toBeUndefined();
  });

  it("keeps slug as-is when resolver returns undefined", () => {
    const f = tmpFile("v1-unresolved.json");
    const v1Lock = {
      version: 1,
      installations: {
        "unknown-server": {
          apps: ["vscode"],
          installedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(v1Lock), "utf-8");

    const resolver = () => undefined;
    const lock = readLockFile(f, resolver);
    expect(lock.version).toBe(2);
    expect(lock.installations["unknown-server"]).toBeDefined();
  });

  it("migrates v1 without resolver (slugs kept as-is)", () => {
    const f = tmpFile("v1-no-resolver.json");
    const v1Lock = {
      version: 1,
      installations: {
        "github-github": {
          apps: ["claude-desktop"],
          installedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(v1Lock), "utf-8");

    const lock = readLockFile(f);
    expect(lock.version).toBe(2);
    expect(lock.installations["github-github"]).toBeDefined();
  });

  it("writes migrated v2 file back to disk", () => {
    const f = tmpFile("v1-writeback.json");
    const v1Lock = {
      version: 1,
      installations: {
        "my-server": {
          apps: ["claude-desktop"],
          installedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          envVars: [],
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(v1Lock), "utf-8");

    readLockFile(f);

    // File on disk should now be v2
    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw.version).toBe(2);
  });

  it("merges entries when multiple slugs resolve to same official name", () => {
    const f = tmpFile("v1-merge.json");
    const v1Lock = {
      version: 1,
      installations: {
        "github-old": {
          apps: ["claude-desktop"],
          installedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          envVars: ["GITHUB_TOKEN"],
        },
        "github-new": {
          apps: ["vscode"],
          installedAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
          envVars: ["EXTRA_VAR"],
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(v1Lock), "utf-8");

    // Both slugs resolve to same official name
    const resolver = (slug: string) =>
      slug === "github-old" || slug === "github-new"
        ? "io.github.github/github-mcp-server"
        : undefined;

    const lock = readLockFile(f, resolver);
    expect(lock.version).toBe(2);
    const entry = lock.installations["io.github.github/github-mcp-server"];
    expect(entry).toBeDefined();
    expect(entry.apps).toContain("claude-desktop");
    expect(entry.apps).toContain("vscode");
    expect(entry.envVars).toContain("GITHUB_TOKEN");
    expect(entry.envVars).toContain("EXTRA_VAR");
  });
});

// ---------------------------------------------------------------------------
// writeLockFile
// ---------------------------------------------------------------------------

describe("writeLockFile", () => {
  it("writes lock file and creates parent directories", () => {
    const f = path.join(tmpDir, "subdir", "lock.json");
    const lock = { version: 2 as const, installations: {} };
    writeLockFile(lock, f);

    expect(fs.existsSync(f)).toBe(true);
    const content = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content).toEqual(lock);
  });

  it("overwrites existing lock file", () => {
    const f = tmpFile("lock.json");
    writeLockFile({ version: 2, installations: {} }, f);
    writeLockFile(
      {
        version: 2,
        installations: {
          test: {
            apps: ["vscode"],
            installedAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            envVars: [],
          },
        },
      },
      f,
    );

    const content = readLockFile(f);
    expect(content.installations).toHaveProperty("test");
  });
});

// ---------------------------------------------------------------------------
// trackInstallation
// ---------------------------------------------------------------------------

describe("trackInstallation", () => {
  it("creates a new installation entry", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], ["GITHUB_TOKEN"], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"]).toBeDefined();
    expect(lock.installations["io.github.test/github"].apps).toEqual(["claude-desktop"]);
    expect(lock.installations["io.github.test/github"].envVars).toEqual(["GITHUB_TOKEN"]);
    expect(lock.installations["io.github.test/github"].installedAt).toBeTruthy();
    expect(lock.installations["io.github.test/github"].updatedAt).toBeTruthy();
  });

  it("merges apps on re-installation", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], ["GITHUB_TOKEN"], f);
    trackInstallation("io.github.test/github", ["vscode"], [], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].apps).toContain("claude-desktop");
    expect(lock.installations["io.github.test/github"].apps).toContain("vscode");
  });

  it("deduplicates apps", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], [], f);
    trackInstallation("io.github.test/github", ["claude-desktop"], [], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].apps).toEqual(["claude-desktop"]);
  });

  it("merges env var names", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], ["GITHUB_TOKEN"], f);
    trackInstallation("io.github.test/github", ["vscode"], ["EXTRA_VAR"], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].envVars).toContain("GITHUB_TOKEN");
    expect(lock.installations["io.github.test/github"].envVars).toContain("EXTRA_VAR");
  });

  it("tracks multiple servers independently", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], [], f);
    trackInstallation("io.github.test/slack", ["vscode"], [], f);

    const lock = readLockFile(f);
    expect(Object.keys(lock.installations)).toEqual([
      "io.github.test/github",
      "io.github.test/slack",
    ]);
  });

  it("persists per-app scopes to lock file", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-code"], ["GITHUB_TOKEN"], f, {
      "claude-code": "global",
    });

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].scopes).toEqual({
      "claude-code": "global",
    });
  });

  it("merges per-app scopes on re-installation", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-code"], [], f, {
      "claude-code": "global",
    });
    trackInstallation("io.github.test/github", ["claude-desktop"], [], f, {
      "claude-desktop": "project",
    });

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].scopes).toEqual({
      "claude-code": "global",
      "claude-desktop": "project",
    });
  });

  it("updates scope for existing app on re-installation", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-code"], [], f, {
      "claude-code": "project",
    });
    trackInstallation("io.github.test/github", ["claude-code"], [], f, {
      "claude-code": "global",
    });

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].scopes).toEqual({
      "claude-code": "global",
    });
  });

  it("omits scopes field when not provided (backwards compat)", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], [], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].scopes).toBeUndefined();
  });

  it("cleans up scopes on removal", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-code", "claude-desktop"], [], f, {
      "claude-code": "global",
      "claude-desktop": "project",
    });
    trackRemoval("io.github.test/github", ["claude-code"], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].scopes).toEqual({
      "claude-desktop": "project",
    });
  });
});

// ---------------------------------------------------------------------------
// trackRemoval
// ---------------------------------------------------------------------------

describe("trackRemoval", () => {
  it("removes app from installation", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop", "vscode"], [], f);
    trackRemoval("io.github.test/github", ["vscode"], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"].apps).toEqual(["claude-desktop"]);
  });

  it("removes entire entry when no apps remain", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], [], f);
    trackRemoval("io.github.test/github", ["claude-desktop"], f);

    const lock = readLockFile(f);
    expect(lock.installations["io.github.test/github"]).toBeUndefined();
  });

  it("handles removal of non-existent server gracefully", () => {
    const f = tmpFile("lock.json");
    trackRemoval("nonexistent", ["claude-desktop"], f);
    const lock = readLockFile(f);
    expect(lock.installations).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getTrackedServers
// ---------------------------------------------------------------------------

describe("getTrackedServers", () => {
  it("returns lock file contents", () => {
    const f = tmpFile("lock.json");
    trackInstallation("io.github.test/github", ["claude-desktop"], ["GITHUB_TOKEN"], f);

    const lock = getTrackedServers(f);
    expect(lock.version).toBe(2);
    expect(lock.installations["io.github.test/github"]).toBeDefined();
  });

  it("returns empty lock for non-existent file", () => {
    const lock = getTrackedServers(tmpFile("missing.json"));
    expect(lock).toEqual({ version: 2, installations: {} });
  });
});
