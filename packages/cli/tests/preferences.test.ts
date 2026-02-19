import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { AppIdType } from "@getmcp/core";
import {
  getPreferencesPath,
  readPreferences,
  saveSelectedApps,
  getSavedSelectedApps,
} from "../src/preferences.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-prefs-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function tmpFile(name: string): string {
  return path.join(tmpDir, name);
}

// ---------------------------------------------------------------------------
// getPreferencesPath
// ---------------------------------------------------------------------------

describe("getPreferencesPath", () => {
  it("returns a path ending with preferences.json inside a getmcp directory", () => {
    const p = getPreferencesPath();
    expect(path.basename(p)).toBe("preferences.json");
    expect(path.basename(path.dirname(p))).toBe("getmcp");
  });

  it("returns an absolute path", () => {
    const p = getPreferencesPath();
    expect(path.isAbsolute(p)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// readPreferences
// ---------------------------------------------------------------------------

describe("readPreferences", () => {
  it("returns empty object when file does not exist", () => {
    expect(readPreferences(tmpFile("missing.json"))).toEqual({});
  });

  it("returns empty object for empty file", () => {
    const f = tmpFile("empty.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(readPreferences(f)).toEqual({});
  });

  it("returns empty object for invalid JSON", () => {
    const f = tmpFile("bad.json");
    fs.writeFileSync(f, "not json {{{", "utf-8");
    expect(readPreferences(f)).toEqual({});
  });

  it("returns empty object if file contains a non-object (array)", () => {
    const f = tmpFile("array.json");
    fs.writeFileSync(f, '["a", "b"]', "utf-8");
    expect(readPreferences(f)).toEqual({});
  });

  it("returns empty object if file contains a non-object (string)", () => {
    const f = tmpFile("string.json");
    fs.writeFileSync(f, '"hello"', "utf-8");
    expect(readPreferences(f)).toEqual({});
  });

  it("returns empty object if selectedApps is not an array of strings", () => {
    const f = tmpFile("bad-apps.json");
    fs.writeFileSync(f, '{"selectedApps": [1, 2, 3]}', "utf-8");
    expect(readPreferences(f)).toEqual({});
  });

  it("returns empty object if selectedApps is a string instead of array", () => {
    const f = tmpFile("string-apps.json");
    fs.writeFileSync(f, '{"selectedApps": "vscode"}', "utf-8");
    expect(readPreferences(f)).toEqual({});
  });

  it("parses valid preferences", () => {
    const f = tmpFile("valid.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ selectedApps: ["vscode", "cursor"] }),
      "utf-8",
    );
    expect(readPreferences(f)).toEqual({
      selectedApps: ["vscode", "cursor"],
    });
  });

  it("preserves unknown keys in the preferences object", () => {
    const f = tmpFile("extra.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ selectedApps: ["vscode"], futureKey: true }),
      "utf-8",
    );
    const result = readPreferences(f);
    expect(result.selectedApps).toEqual(["vscode"]);
  });
});

// ---------------------------------------------------------------------------
// saveSelectedApps
// ---------------------------------------------------------------------------

describe("saveSelectedApps", () => {
  it("creates the file and parent directories", () => {
    const f = path.join(tmpDir, "nested", "dir", "prefs.json");
    saveSelectedApps(["claude-desktop", "vscode"], f);

    expect(fs.existsSync(f)).toBe(true);
    const content = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content.selectedApps).toEqual(["claude-desktop", "vscode"]);
  });

  it("overwrites previous selectedApps", () => {
    const f = tmpFile("prefs.json");
    saveSelectedApps(["vscode"], f);
    saveSelectedApps(["cursor", "claude-desktop"], f);

    const content = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content.selectedApps).toEqual(["cursor", "claude-desktop"]);
  });

  it("preserves other keys in the preferences file", () => {
    const f = tmpFile("prefs.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ selectedApps: ["vscode"], otherSetting: "keep" }),
      "utf-8",
    );

    saveSelectedApps(["cursor"], f);

    const content = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content.selectedApps).toEqual(["cursor"]);
    expect(content.otherSetting).toBe("keep");
  });

  it("saves an empty array", () => {
    const f = tmpFile("prefs.json");
    saveSelectedApps([], f);

    const content = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content.selectedApps).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSavedSelectedApps
// ---------------------------------------------------------------------------

describe("getSavedSelectedApps", () => {
  it("returns null when no preferences file exists", () => {
    expect(getSavedSelectedApps(tmpFile("missing.json"))).toBeNull();
  });

  it("returns null when preferences exist but have no selectedApps", () => {
    const f = tmpFile("no-apps.json");
    fs.writeFileSync(f, '{"otherKey": true}', "utf-8");
    expect(getSavedSelectedApps(f)).toBeNull();
  });

  it("returns the saved app IDs", () => {
    const f = tmpFile("prefs.json");
    saveSelectedApps(["vscode", "cursor", "claude-desktop"], f);
    expect(getSavedSelectedApps(f)).toEqual([
      "vscode",
      "cursor",
      "claude-desktop",
    ]);
  });

  it("returns null for corrupt file (graceful fallback)", () => {
    const f = tmpFile("corrupt.json");
    fs.writeFileSync(f, "{{invalid json}}", "utf-8");
    expect(getSavedSelectedApps(f)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it("save then read returns the same data", () => {
    const f = tmpFile("roundtrip.json");
    const apps: AppIdType[] = ["claude-desktop", "vscode", "cursor", "goose"];

    saveSelectedApps(apps, f);
    const result = getSavedSelectedApps(f);

    expect(result).toEqual(apps);
  });

  it("multiple saves keep only the latest selection", () => {
    const f = tmpFile("multi.json");

    saveSelectedApps(["vscode"], f);
    expect(getSavedSelectedApps(f)).toEqual(["vscode"]);

    saveSelectedApps(["cursor", "goose"], f);
    expect(getSavedSelectedApps(f)).toEqual(["cursor", "goose"]);

    saveSelectedApps(["claude-desktop"], f);
    expect(getSavedSelectedApps(f)).toEqual(["claude-desktop"]);
  });
});
