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
  stripJsoncComments,
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
    fs.writeFileSync(f, JSON.stringify({ mcpServers: { slack: { command: "npx" } } }), "utf-8");
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
    fs.writeFileSync(f, JSON.stringify({ mcpServers: { github: {}, slack: {} } }), "utf-8");
    expect(listServersInConfig(f)).toEqual(["github", "slack"]);
  });

  it("lists servers under 'servers' key (VS Code)", () => {
    const f = tmpFile("list2.json");
    fs.writeFileSync(f, JSON.stringify({ servers: { github: {}, test: {} } }), "utf-8");
    expect(listServersInConfig(f)).toEqual(["github", "test"]);
  });

  it("lists servers under 'context_servers' key (Zed)", () => {
    const f = tmpFile("list3.json");
    fs.writeFileSync(f, JSON.stringify({ context_servers: { myserver: {} } }), "utf-8");
    expect(listServersInConfig(f)).toEqual(["myserver"]);
  });

  it("lists servers under 'mcp' key (OpenCode)", () => {
    const f = tmpFile("list4.json");
    fs.writeFileSync(f, JSON.stringify({ mcp: { server1: {}, server2: {} } }), "utf-8");
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

  it("lists servers under 'mcp_servers' key (Codex)", () => {
    const f = tmpFile("list6.toml");
    fs.writeFileSync(
      f,
      `[mcp_servers.github]\ncommand = "npx"\n\n[mcp_servers.slack]\ncommand = "npx"\n`,
      "utf-8",
    );
    expect(listServersInConfig(f)).toEqual(["github", "slack"]);
  });

  it("lists servers under 'extensions' key (Goose)", () => {
    const f = tmpFile("list7.yaml");
    fs.writeFileSync(f, `extensions:\n  github:\n    cmd: npx\n  slack:\n    cmd: npx\n`, "utf-8");
    expect(listServersInConfig(f)).toEqual(["github", "slack"]);
  });
});

// ---------------------------------------------------------------------------
// YAML format support
// ---------------------------------------------------------------------------

describe("readConfigFile (YAML)", () => {
  it("reads and parses a valid YAML file", () => {
    const f = tmpFile("config.yaml");
    fs.writeFileSync(f, `extensions:\n  github:\n    cmd: npx\n    enabled: true\n`, "utf-8");
    const result = readConfigFile(f);
    expect(result).toEqual({
      extensions: { github: { cmd: "npx", enabled: true } },
    });
  });

  it("reads .yml extension as YAML", () => {
    const f = tmpFile("config.yml");
    fs.writeFileSync(f, `extensions:\n  myserver:\n    cmd: node\n`, "utf-8");
    const result = readConfigFile(f);
    expect(result).toEqual({
      extensions: { myserver: { cmd: "node" } },
    });
  });

  it("returns empty object for non-existent .yaml file", () => {
    expect(readConfigFile(tmpFile("missing.yaml"))).toEqual({});
  });

  it("returns empty object for empty .yaml file", () => {
    const f = tmpFile("empty.yaml");
    fs.writeFileSync(f, "", "utf-8");
    expect(readConfigFile(f)).toEqual({});
  });

  it("handles YAML with arrays", () => {
    const f = tmpFile("arrays.yaml");
    fs.writeFileSync(
      f,
      `extensions:\n  github:\n    cmd: npx\n    args:\n      - -y\n      - "@server/github"\n`,
      "utf-8",
    );
    const result = readConfigFile(f);
    const github = (result.extensions as Record<string, Record<string, unknown>>).github;
    expect(github.args).toEqual(["-y", "@server/github"]);
  });

  it("handles YAML with nested env objects", () => {
    const f = tmpFile("envs.yaml");
    fs.writeFileSync(
      f,
      `extensions:\n  test:\n    cmd: npx\n    envs:\n      API_KEY: secret123\n      TOKEN: abc\n`,
      "utf-8",
    );
    const result = readConfigFile(f);
    const test = (result.extensions as Record<string, Record<string, unknown>>).test;
    expect(test.envs).toEqual({ API_KEY: "secret123", TOKEN: "abc" });
  });

  it("throws for malformed YAML", () => {
    const f = tmpFile("bad.yaml");
    fs.writeFileSync(f, `extensions:\n  - invalid: [unterminated`, "utf-8");
    expect(() => readConfigFile(f)).toThrow(/Failed to parse/);
  });
});

describe("writeConfigFile (YAML)", () => {
  it("writes valid YAML to a .yaml file", () => {
    const f = tmpFile("out.yaml");
    writeConfigFile(f, { extensions: { github: { cmd: "npx", enabled: true } } });
    const content = fs.readFileSync(f, "utf-8");
    expect(content).toContain("extensions:");
    expect(content).toContain("cmd: npx");
    expect(content).toContain("enabled: true");
  });

  it("writes .yml file as YAML", () => {
    const f = tmpFile("out.yml");
    writeConfigFile(f, { test: { key: "value" } });
    const content = fs.readFileSync(f, "utf-8");
    expect(content).toContain("test:");
    expect(content).toContain("key: value");
  });

  it("creates parent directories for YAML", () => {
    const f = path.join(tmpDir, "nested", "deep", "config.yaml");
    writeConfigFile(f, { test: true });
    expect(fs.existsSync(f)).toBe(true);
  });

  it("produces content that can be read back", () => {
    const f = tmpFile("roundtrip.yaml");
    const original = {
      extensions: { github: { cmd: "npx", args: ["-y", "server"], enabled: true } },
    };
    writeConfigFile(f, original);
    const result = readConfigFile(f);
    expect(result).toEqual(original);
  });
});

describe("mergeServerIntoConfig (YAML)", () => {
  it("merges into an existing Goose YAML config", () => {
    const f = tmpFile("merge.yaml");
    fs.writeFileSync(f, `extensions:\n  existing:\n    cmd: node\n    enabled: true\n`, "utf-8");
    const result = mergeServerIntoConfig(f, {
      extensions: { github: { cmd: "npx", enabled: true } },
    });
    expect(result.extensions).toEqual({
      existing: { cmd: "node", enabled: true },
      github: { cmd: "npx", enabled: true },
    });
  });

  it("merges into non-existent .yaml file", () => {
    const f = tmpFile("merge-new.yaml");
    const result = mergeServerIntoConfig(f, {
      extensions: { github: { cmd: "npx" } },
    });
    expect(result).toEqual({ extensions: { github: { cmd: "npx" } } });
  });
});

describe("removeServerFromConfig (YAML)", () => {
  it("removes a server from a Goose YAML config", () => {
    const f = tmpFile("remove.yaml");
    fs.writeFileSync(f, `extensions:\n  github:\n    cmd: npx\n  slack:\n    cmd: npx\n`, "utf-8");
    const result = removeServerFromConfig(f, "github");
    expect(result).not.toBeNull();
    expect((result!.extensions as Record<string, unknown>).github).toBeUndefined();
    expect((result!.extensions as Record<string, unknown>).slack).toBeDefined();
  });

  it("returns null if server not found in YAML", () => {
    const f = tmpFile("remove2.yaml");
    fs.writeFileSync(f, `extensions:\n  slack:\n    cmd: npx\n`, "utf-8");
    expect(removeServerFromConfig(f, "nonexistent")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TOML format support
// ---------------------------------------------------------------------------

describe("readConfigFile (TOML)", () => {
  it("reads and parses a valid TOML file", () => {
    const f = tmpFile("config.toml");
    fs.writeFileSync(
      f,
      `[mcp_servers.github]\ncommand = "npx"\nargs = ["-y", "@server/github"]\n`,
      "utf-8",
    );
    const result = readConfigFile(f);
    expect((result.mcp_servers as Record<string, Record<string, unknown>>).github).toEqual({
      command: "npx",
      args: ["-y", "@server/github"],
    });
  });

  it("returns empty object for non-existent .toml file", () => {
    expect(readConfigFile(tmpFile("missing.toml"))).toEqual({});
  });

  it("returns empty object for empty .toml file", () => {
    const f = tmpFile("empty.toml");
    fs.writeFileSync(f, "", "utf-8");
    expect(readConfigFile(f)).toEqual({});
  });

  it("handles TOML with nested tables", () => {
    const f = tmpFile("nested.toml");
    fs.writeFileSync(
      f,
      `[mcp_servers.github]\ncommand = "npx"\n\n[mcp_servers.github.env]\nGITHUB_TOKEN = "abc123"\n`,
      "utf-8",
    );
    const result = readConfigFile(f);
    const github = (result.mcp_servers as Record<string, Record<string, unknown>>).github;
    expect(github.command).toBe("npx");
    expect(github.env).toEqual({ GITHUB_TOKEN: "abc123" });
  });

  it("handles TOML with remote server config", () => {
    const f = tmpFile("remote.toml");
    fs.writeFileSync(
      f,
      `[mcp_servers.remote]\nurl = "https://mcp.example.com/mcp"\n\n[mcp_servers.remote.http_headers]\nAuthorization = "Bearer token123"\n`,
      "utf-8",
    );
    const result = readConfigFile(f);
    const remote = (result.mcp_servers as Record<string, Record<string, unknown>>).remote;
    expect(remote.url).toBe("https://mcp.example.com/mcp");
    expect(remote.http_headers).toEqual({ Authorization: "Bearer token123" });
  });

  it("throws for malformed TOML", () => {
    const f = tmpFile("bad.toml");
    fs.writeFileSync(f, `[invalid\nkey = `, "utf-8");
    expect(() => readConfigFile(f)).toThrow(/Failed to parse/);
  });
});

describe("writeConfigFile (TOML)", () => {
  it("writes valid TOML to a .toml file", () => {
    const f = tmpFile("out.toml");
    writeConfigFile(f, { mcp_servers: { github: { command: "npx" } } });
    const content = fs.readFileSync(f, "utf-8");
    expect(content).toContain("[mcp_servers.github]");
    expect(content).toContain('command = "npx"');
  });

  it("creates parent directories for TOML", () => {
    const f = path.join(tmpDir, "nested", "deep", "config.toml");
    writeConfigFile(f, { mcp_servers: { test: { command: "npx" } } });
    expect(fs.existsSync(f)).toBe(true);
  });

  it("produces content that can be read back", () => {
    const f = tmpFile("roundtrip.toml");
    const original = { mcp_servers: { github: { command: "npx", args: ["-y", "server"] } } };
    writeConfigFile(f, original);
    const result = readConfigFile(f);
    expect(result).toEqual(original);
  });
});

describe("mergeServerIntoConfig (TOML)", () => {
  it("merges into an existing Codex TOML config", () => {
    const f = tmpFile("merge.toml");
    fs.writeFileSync(f, `[mcp_servers.existing]\ncommand = "node"\n`, "utf-8");
    const result = mergeServerIntoConfig(f, {
      mcp_servers: { github: { command: "npx" } },
    });
    expect(result.mcp_servers).toEqual({
      existing: { command: "node" },
      github: { command: "npx" },
    });
  });

  it("merges into non-existent .toml file", () => {
    const f = tmpFile("merge-new.toml");
    const result = mergeServerIntoConfig(f, {
      mcp_servers: { github: { command: "npx" } },
    });
    expect(result).toEqual({ mcp_servers: { github: { command: "npx" } } });
  });
});

describe("removeServerFromConfig (TOML)", () => {
  it("removes a server from a Codex TOML config", () => {
    const f = tmpFile("remove.toml");
    fs.writeFileSync(
      f,
      `[mcp_servers.github]\ncommand = "npx"\n\n[mcp_servers.slack]\ncommand = "npx"\n`,
      "utf-8",
    );
    const result = removeServerFromConfig(f, "github");
    expect(result).not.toBeNull();
    expect((result!.mcp_servers as Record<string, unknown>).github).toBeUndefined();
    expect((result!.mcp_servers as Record<string, unknown>).slack).toBeDefined();
  });

  it("returns null if server not found in TOML", () => {
    const f = tmpFile("remove2.toml");
    fs.writeFileSync(f, `[mcp_servers.slack]\ncommand = "npx"\n`, "utf-8");
    expect(removeServerFromConfig(f, "nonexistent")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// JSONC comment stripping (bug fix verification)
// ---------------------------------------------------------------------------

describe("stripJsoncComments", () => {
  it("preserves URLs with // inside string values", () => {
    const input = '{"url": "https://example.com/path"}';
    expect(stripJsoncComments(input)).toBe(input);
  });

  it("strips single-line comments outside strings", () => {
    const input = `{
  // this is a comment
  "key": "value"
}`;
    const result = stripJsoncComments(input);
    expect(result).not.toContain("// this is a comment");
    expect(result).toContain('"key": "value"');
  });

  it("strips multi-line comments outside strings", () => {
    const input = `{
  /* multi-line
     comment */
  "key": "value"
}`;
    const result = stripJsoncComments(input);
    expect(result).not.toContain("multi-line");
    expect(result).toContain('"key": "value"');
  });

  it("preserves // inside string values even with surrounding comments", () => {
    const input = `{
  // a comment
  "url": "https://example.com",
  "other": "value" // trailing comment
}`;
    const result = stripJsoncComments(input);
    expect(result).toContain('"https://example.com"');
    expect(result).not.toContain("a comment");
    expect(result).not.toContain("trailing comment");
  });

  it("handles escaped quotes inside strings", () => {
    const input = '{"key": "value with \\"escaped\\" quotes"}';
    const result = stripJsoncComments(input);
    expect(result).toBe(input);
  });

  it("handles empty input", () => {
    expect(stripJsoncComments("")).toBe("");
  });

  it("handles input with no comments", () => {
    const input = '{"key": "value", "num": 42}';
    expect(stripJsoncComments(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// Full round-trip tests (write then read back)
// ---------------------------------------------------------------------------

describe("round-trip JSON", () => {
  it("write and read back a complex JSON config", () => {
    const f = tmpFile("roundtrip.json");
    const config = {
      mcpServers: {
        github: { command: "npx", args: ["-y", "server-github"], env: { TOKEN: "abc" } },
        slack: { command: "node", args: ["slack.js"] },
      },
    };
    writeConfigFile(f, config);
    expect(readConfigFile(f)).toEqual(config);
  });
});

describe("round-trip YAML", () => {
  it("write and read back a Goose-style YAML config", () => {
    const f = tmpFile("roundtrip.yaml");
    const config = {
      extensions: {
        github: {
          name: "github",
          cmd: "npx",
          args: ["-y", "server"],
          enabled: true,
          type: "stdio",
        },
        remote: { name: "remote", uri: "https://mcp.example.com", enabled: true, type: "sse" },
      },
    };
    writeConfigFile(f, config);
    expect(readConfigFile(f)).toEqual(config);
  });
});

describe("round-trip TOML", () => {
  it("write and read back a Codex-style TOML config", () => {
    const f = tmpFile("roundtrip.toml");
    const config = {
      mcp_servers: {
        github: { command: "npx", args: ["-y", "server-github"] },
        remote: { url: "https://mcp.example.com/mcp" },
      },
    };
    writeConfigFile(f, config);
    expect(readConfigFile(f)).toEqual(config);
  });
});
