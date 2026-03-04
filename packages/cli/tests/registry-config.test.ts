import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getRegistriesConfigPath,
  readRegistriesConfig,
  writeRegistriesConfig,
  addRegistry,
  removeRegistry,
  getAllRegistries,
  getEffectiveRegistries,
  type RegistrySourceType,
} from "../src/registry-config.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const OFFICIAL_REGISTRY: RegistrySourceType = {
  name: "official",
  url: "https://registry.modelcontextprotocol.io",
  type: "public",
  priority: 0,
};

function makeRegistry(overrides: Partial<RegistrySourceType> = {}): RegistrySourceType {
  return {
    name: "my-registry",
    url: "https://example.com/registry",
    type: "public",
    priority: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-reg-config-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function tmpFile(name: string): string {
  return path.join(tmpDir, name);
}

// ---------------------------------------------------------------------------
// getRegistriesConfigPath
// ---------------------------------------------------------------------------

describe("getRegistriesConfigPath", () => {
  it("returns a path ending with registries.json inside a getmcp directory", () => {
    const p = getRegistriesConfigPath();
    expect(path.basename(p)).toBe("registries.json");
    expect(path.basename(path.dirname(p))).toBe("getmcp");
  });

  it("returns an absolute path", () => {
    const p = getRegistriesConfigPath();
    expect(path.isAbsolute(p)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// readRegistriesConfig
// ---------------------------------------------------------------------------

describe("readRegistriesConfig", () => {
  it("returns empty array when file does not exist", () => {
    expect(readRegistriesConfig(tmpFile("missing.json"))).toEqual([]);
  });

  it("returns empty array for empty file", () => {
    const f = tmpFile("empty.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("returns empty array for whitespace-only file", () => {
    const f = tmpFile("whitespace.json");
    fs.writeFileSync(f, "   \n  ", "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("returns empty array for invalid JSON", () => {
    const f = tmpFile("bad.json");
    fs.writeFileSync(f, "not json {{{", "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("returns empty array if file contains a non-array (object)", () => {
    const f = tmpFile("object.json");
    fs.writeFileSync(f, '{"name": "test"}', "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("returns empty array if file contains a non-array (string)", () => {
    const f = tmpFile("string.json");
    fs.writeFileSync(f, '"hello"', "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("returns empty array if entries fail Zod validation (missing required fields)", () => {
    const f = tmpFile("invalid-entries.json");
    fs.writeFileSync(f, '[{"name": "test"}]', "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("returns empty array if entries fail Zod validation (invalid name format)", () => {
    const f = tmpFile("invalid-name.json");
    const entry = {
      name: "Invalid Name!",
      url: "https://example.com",
      type: "public",
      priority: 100,
    };
    fs.writeFileSync(f, JSON.stringify([entry]), "utf-8");
    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("parses valid registry config", () => {
    const f = tmpFile("valid.json");
    const reg = makeRegistry();
    fs.writeFileSync(f, JSON.stringify([reg]), "utf-8");
    expect(readRegistriesConfig(f)).toEqual([reg]);
  });

  it("parses multiple valid registry entries", () => {
    const f = tmpFile("multi.json");
    const regs = [
      makeRegistry({ name: "alpha", priority: 50 }),
      makeRegistry({ name: "beta", priority: 200 }),
    ];
    fs.writeFileSync(f, JSON.stringify(regs), "utf-8");
    expect(readRegistriesConfig(f)).toEqual(regs);
  });

  it("applies Zod defaults (type, priority) when fields are omitted", () => {
    const f = tmpFile("defaults.json");
    const minimal = [{ name: "minimal", url: "https://example.com/api" }];
    fs.writeFileSync(f, JSON.stringify(minimal), "utf-8");
    const result = readRegistriesConfig(f);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("public");
    expect(result[0].priority).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// writeRegistriesConfig
// ---------------------------------------------------------------------------

describe("writeRegistriesConfig", () => {
  it("creates the file and parent directories", () => {
    const f = path.join(tmpDir, "nested", "dir", "registries.json");
    const reg = makeRegistry();
    writeRegistriesConfig([reg], f);

    expect(fs.existsSync(f)).toBe(true);
    const content: unknown = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content).toEqual([reg]);
  });

  it("writes an empty array", () => {
    const f = tmpFile("empty-write.json");
    writeRegistriesConfig([], f);

    expect(fs.existsSync(f)).toBe(true);
    const content: unknown = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content).toEqual([]);
  });

  it("overwrites existing file contents", () => {
    const f = tmpFile("overwrite.json");
    const first = [makeRegistry({ name: "first" })];
    const second = [makeRegistry({ name: "second" })];

    writeRegistriesConfig(first, f);
    writeRegistriesConfig(second, f);

    const content: unknown = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(content).toEqual(second);
  });

  it("writes with pretty-printing and trailing newline", () => {
    const f = tmpFile("formatted.json");
    writeRegistriesConfig([makeRegistry()], f);

    const raw = fs.readFileSync(f, "utf-8");
    expect(raw).toMatch(/\n$/);
    expect(raw).toMatch(/  "/); // indented — pretty-printed
  });

  it("does not leave a .tmp file behind on success", () => {
    const f = tmpFile("atomic.json");
    writeRegistriesConfig([makeRegistry()], f);

    expect(fs.existsSync(f + ".tmp")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addRegistry
// ---------------------------------------------------------------------------

describe("addRegistry", () => {
  it("adds a registry to an empty config", () => {
    const f = tmpFile("add.json");
    const reg = makeRegistry();
    addRegistry(reg, f);

    expect(readRegistriesConfig(f)).toEqual([reg]);
  });

  it("appends to an existing config", () => {
    const f = tmpFile("append.json");
    const first = makeRegistry({ name: "alpha" });
    const second = makeRegistry({ name: "beta" });

    addRegistry(first, f);
    addRegistry(second, f);

    const result = readRegistriesConfig(f);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toContain("alpha");
    expect(result.map((r) => r.name)).toContain("beta");
  });

  it('rejects "official" as a reserved name', () => {
    const f = tmpFile("official.json");
    const reg = makeRegistry({ name: "official" });
    expect(() => addRegistry(reg, f)).toThrow(/reserved/i);
    expect(fs.existsSync(f)).toBe(false);
  });

  it("rejects a duplicate registry name", () => {
    const f = tmpFile("duplicate.json");
    const reg = makeRegistry({ name: "my-registry" });
    addRegistry(reg, f);

    expect(() =>
      addRegistry(makeRegistry({ name: "my-registry", url: "https://other.com" }), f),
    ).toThrow(/already exists/i);
    expect(readRegistriesConfig(f)).toHaveLength(1);
  });

  it("throws and does not modify the file on invalid source (bad URL)", () => {
    const f = tmpFile("bad-url.json");
    const valid = makeRegistry({ name: "valid" });
    addRegistry(valid, f);

    const badReg = makeRegistry({ name: "bad", url: "not-a-url" });
    expect(() => addRegistry(badReg, f)).toThrow();
    expect(readRegistriesConfig(f)).toHaveLength(1);
  });

  it("throws and does not modify the file on invalid source (invalid name chars)", () => {
    const f = tmpFile("bad-name.json");
    const badReg = makeRegistry({ name: "Invalid Name!" });
    expect(() => addRegistry(badReg, f)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// removeRegistry
// ---------------------------------------------------------------------------

describe("removeRegistry", () => {
  it("removes an existing registry and returns true", () => {
    const f = tmpFile("remove.json");
    addRegistry(makeRegistry({ name: "to-remove" }), f);
    addRegistry(makeRegistry({ name: "keep" }), f);

    const result = removeRegistry("to-remove", f);

    expect(result).toBe(true);
    const remaining = readRegistriesConfig(f);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe("keep");
  });

  it("returns false for a registry that does not exist", () => {
    const f = tmpFile("not-found.json");
    writeRegistriesConfig([], f);

    expect(removeRegistry("nonexistent", f)).toBe(false);
  });

  it("returns false when the config file is missing", () => {
    const f = tmpFile("missing.json");
    expect(removeRegistry("anything", f)).toBe(false);
  });

  it('rejects "official" as a reserved name', () => {
    const f = tmpFile("official-remove.json");
    expect(() => removeRegistry("official", f)).toThrow(/reserved/i);
  });

  it("leaves an empty array after removing the last registry", () => {
    const f = tmpFile("last.json");
    addRegistry(makeRegistry({ name: "only" }), f);
    removeRegistry("only", f);

    expect(readRegistriesConfig(f)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAllRegistries
// ---------------------------------------------------------------------------

describe("getAllRegistries", () => {
  it("always includes the official registry even with no config file", () => {
    const f = tmpFile("missing.json");
    const result = getAllRegistries(f);

    expect(result).toContainEqual(OFFICIAL_REGISTRY);
  });

  it("always includes the official registry with an empty config", () => {
    const f = tmpFile("empty-config.json");
    writeRegistriesConfig([], f);

    const result = getAllRegistries(f);
    expect(result).toContainEqual(OFFICIAL_REGISTRY);
  });

  it("includes official plus custom registries", () => {
    const f = tmpFile("combined.json");
    const custom = makeRegistry({ name: "custom", priority: 50 });
    writeRegistriesConfig([custom], f);

    const result = getAllRegistries(f);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toContain("official");
    expect(result.map((r) => r.name)).toContain("custom");
  });

  it("sorts by priority ascending (lower number = higher priority)", () => {
    const f = tmpFile("sorted.json");
    writeRegistriesConfig(
      [
        makeRegistry({ name: "low-prio", priority: 200 }),
        makeRegistry({ name: "high-prio", priority: 10 }),
      ],
      f,
    );

    const result = getAllRegistries(f);
    const priorities = result.map((r) => r.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it("official registry (priority 0) always sorts first", () => {
    const f = tmpFile("official-first.json");
    writeRegistriesConfig([makeRegistry({ name: "custom", priority: 1 })], f);

    const result = getAllRegistries(f);
    expect(result[0].name).toBe("official");
  });

  it("does not include the official registry in the stored file", () => {
    const f = tmpFile("not-stored.json");
    writeRegistriesConfig([makeRegistry()], f);

    const raw = fs.readFileSync(f, "utf-8");
    expect(raw).not.toContain('"official"');
  });
});

// ---------------------------------------------------------------------------
// getEffectiveRegistries
// ---------------------------------------------------------------------------

describe("getEffectiveRegistries", () => {
  it("returns all global registries when no project registries provided", () => {
    const f = tmpFile("no-project.json");
    const custom = makeRegistry({ name: "global-custom", priority: 50 });
    writeRegistriesConfig([custom], f);

    const result = getEffectiveRegistries(undefined, f);
    expect(result.map((r) => r.name)).toContain("official");
    expect(result.map((r) => r.name)).toContain("global-custom");
  });

  it("returns all global registries when project registries is empty array", () => {
    const f = tmpFile("empty-project.json");
    writeRegistriesConfig([], f);

    const result = getEffectiveRegistries([], f);
    expect(result).toContainEqual(OFFICIAL_REGISTRY);
  });

  it("project registry overrides global registry with same name", () => {
    const f = tmpFile("override.json");
    const globalReg = makeRegistry({
      name: "shared",
      url: "https://global.example.com",
      priority: 100,
    });
    writeRegistriesConfig([globalReg], f);

    const projectReg = makeRegistry({
      name: "shared",
      url: "https://project.example.com",
      priority: 50,
    });
    const result = getEffectiveRegistries([projectReg], f);

    const shared = result.find((r) => r.name === "shared");
    expect(shared?.url).toBe("https://project.example.com");
    expect(shared?.priority).toBe(50);
  });

  it("project-only registries are included alongside global ones", () => {
    const f = tmpFile("project-only.json");
    writeRegistriesConfig([makeRegistry({ name: "global-only" })], f);

    const projectReg = makeRegistry({ name: "project-only", priority: 75 });
    const result = getEffectiveRegistries([projectReg], f);

    const names = result.map((r) => r.name);
    expect(names).toContain("official");
    expect(names).toContain("global-only");
    expect(names).toContain("project-only");
  });

  it("always includes official even when project registries are provided", () => {
    const f = tmpFile("official-always.json");
    writeRegistriesConfig([], f);

    const projectReg = makeRegistry({ name: "project-reg" });
    const result = getEffectiveRegistries([projectReg], f);

    expect(result.map((r) => r.name)).toContain("official");
  });

  it("project registries cannot override the official registry", () => {
    const f = tmpFile("cannot-override-official.json");
    writeRegistriesConfig([], f);

    const imposter: RegistrySourceType = {
      name: "official",
      url: "https://evil.example.com",
      type: "public",
      priority: 0,
    };
    const result = getEffectiveRegistries([imposter], f);

    const officialEntry = result.find((r) => r.name === "official");
    expect(officialEntry?.url).toBe("https://registry.modelcontextprotocol.io");
  });

  it("result is sorted by priority ascending", () => {
    const f = tmpFile("sorted-effective.json");
    writeRegistriesConfig([makeRegistry({ name: "g1", priority: 150 })], f);

    const project = [makeRegistry({ name: "p1", priority: 5 })];
    const result = getEffectiveRegistries(project, f);

    const priorities = result.map((r) => r.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it("missing global config file is treated as empty global list", () => {
    const f = tmpFile("no-global.json");
    const projectReg = makeRegistry({ name: "project-reg" });
    const result = getEffectiveRegistries([projectReg], f);

    expect(result.map((r) => r.name)).toContain("official");
    expect(result.map((r) => r.name)).toContain("project-reg");
  });
});

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it("write then read returns the same data", () => {
    const f = tmpFile("roundtrip.json");
    const registries: RegistrySourceType[] = [
      makeRegistry({ name: "alpha", url: "https://alpha.example.com", priority: 10 }),
      makeRegistry({
        name: "beta",
        url: "https://beta.example.com",
        type: "private",
        priority: 50,
      }),
    ];

    writeRegistriesConfig(registries, f);
    const result = readRegistriesConfig(f);

    expect(result).toEqual(registries);
  });

  it("add then remove restores empty state", () => {
    const f = tmpFile("add-remove.json");
    addRegistry(makeRegistry({ name: "temp" }), f);
    removeRegistry("temp", f);

    expect(readRegistriesConfig(f)).toEqual([]);
  });

  it("multiple add/remove operations stay consistent", () => {
    const f = tmpFile("multi-ops.json");

    addRegistry(makeRegistry({ name: "first" }), f);
    addRegistry(makeRegistry({ name: "second" }), f);
    addRegistry(makeRegistry({ name: "third" }), f);
    removeRegistry("second", f);

    const result = readRegistriesConfig(f);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["first", "third"]);
  });

  it("getAllRegistries after addRegistry includes the new entry", () => {
    const f = tmpFile("add-get-all.json");
    const custom = makeRegistry({ name: "custom", priority: 50 });
    addRegistry(custom, f);

    const result = getAllRegistries(f);
    expect(result.map((r) => r.name)).toContain("official");
    expect(result.map((r) => r.name)).toContain("custom");
  });
});
