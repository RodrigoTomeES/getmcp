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
    expect(lock).toEqual({ version: 1, installations: {} });
  });

  it("returns empty lock for empty file", () => {
    const f = tmpFile("empty.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(readLockFile(f)).toEqual({ version: 1, installations: {} });
  });

  it("returns empty lock for invalid JSON", () => {
    const f = tmpFile("invalid.json");
    fs.writeFileSync(f, "not json", "utf-8");
    expect(readLockFile(f)).toEqual({ version: 1, installations: {} });
  });

  it("returns empty lock for wrong version", () => {
    const f = tmpFile("wrong-version.json");
    fs.writeFileSync(f, JSON.stringify({ version: 99 }), "utf-8");
    expect(readLockFile(f)).toEqual({ version: 1, installations: {} });
  });

  it("reads valid lock file", () => {
    const f = tmpFile("valid.json");
    const lock = {
      version: 1,
      installations: {
        github: {
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
      version: 1,
      installations: {
        github: {
          apps: "not-an-array",
          installedAt: 12345,
        },
      },
    };
    fs.writeFileSync(f, JSON.stringify(bad), "utf-8");
    expect(readLockFile(f)).toEqual({ version: 1, installations: {} });
  });
});

// ---------------------------------------------------------------------------
// writeLockFile
// ---------------------------------------------------------------------------

describe("writeLockFile", () => {
  it("writes lock file and creates parent directories", () => {
    const f = path.join(tmpDir, "subdir", "lock.json");
    const lock = { version: 1 as const, installations: {} };
    writeLockFile(lock, f);

    expect(fs.existsSync(f)).toBe(true);
    const content = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content).toEqual(lock);
  });

  it("overwrites existing lock file", () => {
    const f = tmpFile("lock.json");
    writeLockFile({ version: 1, installations: {} }, f);
    writeLockFile(
      {
        version: 1,
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
    trackInstallation("github", ["claude-desktop"], ["GITHUB_TOKEN"], f);

    const lock = readLockFile(f);
    expect(lock.installations.github).toBeDefined();
    expect(lock.installations.github.apps).toEqual(["claude-desktop"]);
    expect(lock.installations.github.envVars).toEqual(["GITHUB_TOKEN"]);
    expect(lock.installations.github.installedAt).toBeTruthy();
    expect(lock.installations.github.updatedAt).toBeTruthy();
  });

  it("merges apps on re-installation", () => {
    const f = tmpFile("lock.json");
    trackInstallation("github", ["claude-desktop"], ["GITHUB_TOKEN"], f);
    trackInstallation("github", ["vscode"], [], f);

    const lock = readLockFile(f);
    expect(lock.installations.github.apps).toContain("claude-desktop");
    expect(lock.installations.github.apps).toContain("vscode");
  });

  it("deduplicates apps", () => {
    const f = tmpFile("lock.json");
    trackInstallation("github", ["claude-desktop"], [], f);
    trackInstallation("github", ["claude-desktop"], [], f);

    const lock = readLockFile(f);
    expect(lock.installations.github.apps).toEqual(["claude-desktop"]);
  });

  it("merges env var names", () => {
    const f = tmpFile("lock.json");
    trackInstallation("github", ["claude-desktop"], ["GITHUB_TOKEN"], f);
    trackInstallation("github", ["vscode"], ["EXTRA_VAR"], f);

    const lock = readLockFile(f);
    expect(lock.installations.github.envVars).toContain("GITHUB_TOKEN");
    expect(lock.installations.github.envVars).toContain("EXTRA_VAR");
  });

  it("tracks multiple servers independently", () => {
    const f = tmpFile("lock.json");
    trackInstallation("github", ["claude-desktop"], [], f);
    trackInstallation("slack", ["vscode"], [], f);

    const lock = readLockFile(f);
    expect(Object.keys(lock.installations)).toEqual(["github", "slack"]);
  });
});

// ---------------------------------------------------------------------------
// trackRemoval
// ---------------------------------------------------------------------------

describe("trackRemoval", () => {
  it("removes app from installation", () => {
    const f = tmpFile("lock.json");
    trackInstallation("github", ["claude-desktop", "vscode"], [], f);
    trackRemoval("github", ["vscode"], f);

    const lock = readLockFile(f);
    expect(lock.installations.github.apps).toEqual(["claude-desktop"]);
  });

  it("removes entire entry when no apps remain", () => {
    const f = tmpFile("lock.json");
    trackInstallation("github", ["claude-desktop"], [], f);
    trackRemoval("github", ["claude-desktop"], f);

    const lock = readLockFile(f);
    expect(lock.installations.github).toBeUndefined();
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
    trackInstallation("github", ["claude-desktop"], ["GITHUB_TOKEN"], f);

    const lock = getTrackedServers(f);
    expect(lock.version).toBe(1);
    expect(lock.installations.github).toBeDefined();
  });

  it("returns empty lock for non-existent file", () => {
    const lock = getTrackedServers(tmpFile("missing.json"));
    expect(lock).toEqual({ version: 1, installations: {} });
  });
});
