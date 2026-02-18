import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  readConfigFile,
  writeConfigFile,
  mergeServerIntoConfig,
  removeServerFromConfig,
  listServersInConfig,
} from "../src/config-file.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getmcp-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function tmpFile(name: string): string {
  return path.join(tmpDir, name);
}

// ---------------------------------------------------------------------------
// readConfigFile
// ---------------------------------------------------------------------------

describe("readConfigFile", () => {
  it("returns empty object for non-existent file", () => {
    expect(readConfigFile(tmpFile("missing.json"))).toEqual({});
  });

  it("returns empty object for empty file", () => {
    const f = tmpFile("empty.json");
    fs.writeFileSync(f, "", "utf-8");
    expect(readConfigFile(f)).toEqual({});
  });

  it("parses valid JSON", () => {
    const f = tmpFile("config.json");
    fs.writeFileSync(f, '{"mcpServers": {"test": {"command": "npx"}}}', "utf-8");
    const result = readConfigFile(f);
    expect(result).toEqual({ mcpServers: { test: { command: "npx" } } });
  });

  it("handles JSONC with comments", () => {
    const f = tmpFile("config.jsonc");
    fs.writeFileSync(
      f,
      `{
  // This is a comment
  "servers": {
    "test": {
      "type": "stdio",
      "command": "npx" /* inline comment */
    }
  }
}`,
      "utf-8",
    );
    const result = readConfigFile(f);
    expect(result).toEqual({
      servers: { test: { type: "stdio", command: "npx" } },
    });
  });

  it("throws for invalid JSON", () => {
    const f = tmpFile("bad.json");
    fs.writeFileSync(f, "{invalid", "utf-8");
    expect(() => readConfigFile(f)).toThrow(/Failed to parse/);
  });
});

// ---------------------------------------------------------------------------
// writeConfigFile
// ---------------------------------------------------------------------------

describe("writeConfigFile", () => {
  it("writes JSON with pretty formatting", () => {
    const f = tmpFile("out.json");
    writeConfigFile(f, { mcpServers: { test: { command: "npx" } } });
    const content = fs.readFileSync(f, "utf-8");
    expect(content).toContain('"mcpServers"');
    expect(content).toContain('"command": "npx"');
    // Verify it's valid JSON
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it("creates parent directories", () => {
    const f = path.join(tmpDir, "nested", "deep", "config.json");
    writeConfigFile(f, { test: true });
    expect(fs.existsSync(f)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mergeServerIntoConfig
// ---------------------------------------------------------------------------

describe("mergeServerIntoConfig", () => {
  it("merges into empty/non-existent file", () => {
    const f = tmpFile("merge.json");
    const result = mergeServerIntoConfig(f, {
      mcpServers: { github: { command: "npx", args: ["-y", "server-github"] } },
    });
    expect(result).toEqual({
      mcpServers: { github: { command: "npx", args: ["-y", "server-github"] } },
    });
  });

  it("preserves existing servers when adding a new one", () => {
    const f = tmpFile("merge2.json");
    fs.writeFileSync(
      f,
      JSON.stringify({
        mcpServers: {
          existing: { command: "node", args: ["existing.js"] },
        },
      }),
      "utf-8",
    );
    const result = mergeServerIntoConfig(f, {
      mcpServers: { github: { command: "npx" } },
    });
    expect(result.mcpServers).toEqual({
      existing: { command: "node", args: ["existing.js"] },
      github: { command: "npx" },
    });
  });

  it("overwrites a server with the same name", () => {
    const f = tmpFile("merge3.json");
    fs.writeFileSync(
      f,
      JSON.stringify({
        mcpServers: {
          github: { command: "old-command" },
        },
      }),
      "utf-8",
    );
    const result = mergeServerIntoConfig(f, {
      mcpServers: { github: { command: "npx", args: ["-y", "new-package"] } },
    });
    expect((result.mcpServers as Record<string, unknown>).github).toEqual({
      command: "npx",
      args: ["-y", "new-package"],
    });
  });

  it("preserves non-server config fields", () => {
    const f = tmpFile("merge4.json");
    fs.writeFileSync(
      f,
      JSON.stringify({
        someOtherSetting: true,
        mcpServers: {},
      }),
      "utf-8",
    );
    const result = mergeServerIntoConfig(f, {
      mcpServers: { test: { command: "npx" } },
    });
    expect(result.someOtherSetting).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeServerFromConfig
// ---------------------------------------------------------------------------

describe("removeServerFromConfig", () => {
  it("removes a server that exists", () => {
    const f = tmpFile("remove.json");
    fs.writeFileSync(
      f,
      JSON.stringify({
        mcpServers: {
          github: { command: "npx" },
          slack: { command: "npx" },
        },
      }),
      "utf-8",
    );
    const result = removeServerFromConfig(f, "github");
    expect(result).not.toBeNull();
    expect((result!.mcpServers as Record<string, unknown>).github).toBeUndefined();
    expect((result!.mcpServers as Record<string, unknown>).slack).toBeDefined();
  });

  it("returns null if server not found", () => {
    const f = tmpFile("remove2.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ mcpServers: { slack: { command: "npx" } } }),
      "utf-8",
    );
    const result = removeServerFromConfig(f, "nonexistent");
    expect(result).toBeNull();
  });

  it("returns null for non-existent file", () => {
    const result = removeServerFromConfig(tmpFile("missing.json"), "test");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listServersInConfig
// ---------------------------------------------------------------------------

describe("listServersInConfig", () => {
  it("lists servers under mcpServers key", () => {
    const f = tmpFile("list.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ mcpServers: { github: {}, slack: {} } }),
      "utf-8",
    );
    expect(listServersInConfig(f)).toEqual(["github", "slack"]);
  });

  it("lists servers under 'servers' key (VS Code)", () => {
    const f = tmpFile("list2.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ servers: { github: {}, test: {} } }),
      "utf-8",
    );
    expect(listServersInConfig(f)).toEqual(["github", "test"]);
  });

  it("lists servers under 'context_servers' key (Zed)", () => {
    const f = tmpFile("list3.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ context_servers: { myserver: {} } }),
      "utf-8",
    );
    expect(listServersInConfig(f)).toEqual(["myserver"]);
  });

  it("lists servers under 'mcp' key (OpenCode)", () => {
    const f = tmpFile("list4.json");
    fs.writeFileSync(
      f,
      JSON.stringify({ mcp: { server1: {}, server2: {} } }),
      "utf-8",
    );
    expect(listServersInConfig(f)).toEqual(["server1", "server2"]);
  });

  it("returns empty array for non-existent file", () => {
    expect(listServersInConfig(tmpFile("missing.json"))).toEqual([]);
  });

  it("returns empty array for file with no server sections", () => {
    const f = tmpFile("list5.json");
    fs.writeFileSync(f, JSON.stringify({ someOtherKey: {} }), "utf-8");
    expect(listServersInConfig(f)).toEqual([]);
  });
});
