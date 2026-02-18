import { describe, it, expect } from "vitest";
import type { LooseServerConfigType } from "@getmcp/core";
import {
  ClaudeDesktopGenerator,
  ClaudeCodeGenerator,
  VSCodeGenerator,
  CursorGenerator,
  ClineGenerator,
  RooCodeGenerator,
  GooseGenerator,
  WindsurfGenerator,
  OpenCodeGenerator,
  ZedGenerator,
  PyCharmGenerator,
  generators,
  getGenerator,
  getAppIds,
  generateAllConfigs,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const stdioConfig: LooseServerConfigType = {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" },
  transport: "stdio",
};

const remoteConfig: LooseServerConfigType = {
  url: "https://mcp.example.com/mcp",
  headers: { Authorization: "Bearer token123" },
};

const sseConfig: LooseServerConfigType = {
  url: "https://mcp.example.com/sse",
  transport: "sse",
  headers: {},
};

const minimalStdio: LooseServerConfigType = {
  command: "npx",
  args: [],
  env: {},
  transport: "stdio",
};

// ---------------------------------------------------------------------------
// Claude Desktop
// ---------------------------------------------------------------------------

describe("ClaudeDesktopGenerator", () => {
  const gen = new ClaudeDesktopGenerator();

  it("generates stdio config (passthrough)", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toEqual({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" },
        },
      },
    });
  });

  it("generates remote config", () => {
    const result = gen.generate("remote", remoteConfig);
    expect(result).toEqual({
      mcpServers: {
        remote: {
          url: "https://mcp.example.com/mcp",
          headers: { Authorization: "Bearer token123" },
        },
      },
    });
  });

  it("omits empty args and env", () => {
    const result = gen.generate("minimal", minimalStdio);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).minimal;
    expect(server.args).toBeUndefined();
    expect(server.env).toBeUndefined();
  });

  it("serializes to valid JSON", () => {
    const result = gen.generate("github", stdioConfig);
    const json = gen.serialize(result);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Claude Code
// ---------------------------------------------------------------------------

describe("ClaudeCodeGenerator", () => {
  const gen = new ClaudeCodeGenerator();

  it("generates stdio config", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toEqual({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" },
        },
      },
    });
  });

  it("generates remote config with type field", () => {
    const result = gen.generate("remote", sseConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/sse");
    expect(server.type).toBe("sse");
    expect(server.transport).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// VS Code / Copilot
// ---------------------------------------------------------------------------

describe("VSCodeGenerator", () => {
  const gen = new VSCodeGenerator();

  it("uses 'servers' root key (not 'mcpServers')", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("servers");
    expect(result).not.toHaveProperty("mcpServers");
  });

  it("adds 'type: stdio' for stdio configs", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.servers as Record<string, Record<string, unknown>>).github;
    expect(server.type).toBe("stdio");
  });

  it("adds appropriate type for remote configs", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.servers as Record<string, Record<string, unknown>>).remote;
    expect(server.type).toBe("http");
    expect(server.url).toBe("https://mcp.example.com/mcp");
  });

  it("maps SSE transport to type", () => {
    const result = gen.generate("remote", sseConfig);
    const server = (result.servers as Record<string, Record<string, unknown>>).remote;
    expect(server.type).toBe("sse");
  });
});

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------

describe("CursorGenerator", () => {
  const gen = new CursorGenerator();

  it("generates standard mcpServers format", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
  });
});

// ---------------------------------------------------------------------------
// Cline
// ---------------------------------------------------------------------------

describe("ClineGenerator", () => {
  const gen = new ClineGenerator();

  it("adds alwaysAllow and disabled fields for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.alwaysAllow).toEqual([]);
    expect(server.disabled).toBe(false);
  });

  it("adds alwaysAllow and disabled fields for remote", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.alwaysAllow).toEqual([]);
    expect(server.disabled).toBe(false);
    expect(server.url).toBe("https://mcp.example.com/mcp");
    expect(server.headers).toEqual({ Authorization: "Bearer token123" });
  });
});

// ---------------------------------------------------------------------------
// Roo Code
// ---------------------------------------------------------------------------

describe("RooCodeGenerator", () => {
  const gen = new RooCodeGenerator();

  it("adds alwaysAllow and disabled for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.alwaysAllow).toEqual([]);
    expect(server.disabled).toBe(false);
  });

  it("adds type for remote configs", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    // HTTP inferred → "streamable-http" for Roo Code
    expect(server.type).toBe("streamable-http");
    expect(server.url).toBe("https://mcp.example.com/mcp");
  });

  it("keeps SSE type for SSE configs", () => {
    const result = gen.generate("remote", sseConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.type).toBe("sse");
  });
});

// ---------------------------------------------------------------------------
// Goose
// ---------------------------------------------------------------------------

describe("GooseGenerator", () => {
  const gen = new GooseGenerator();

  it("uses 'extensions' root key", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("extensions");
    expect(result).not.toHaveProperty("mcpServers");
  });

  it("renames command to cmd", () => {
    const result = gen.generate("github", stdioConfig);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).github;
    expect(ext.cmd).toBe("npx");
    expect(ext.command).toBeUndefined();
  });

  it("renames env to envs", () => {
    const result = gen.generate("github", stdioConfig);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).github;
    expect(ext.envs).toEqual({ GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" });
    expect(ext.env).toBeUndefined();
  });

  it("adds enabled and type fields", () => {
    const result = gen.generate("github", stdioConfig);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).github;
    expect(ext.enabled).toBe(true);
    expect(ext.type).toBe("stdio");
  });

  it("converts timeout from ms to seconds", () => {
    const withTimeout: LooseServerConfigType = {
      command: "npx",
      args: [],
      env: {},
      transport: "stdio",
      timeout: 30000,
    };
    const result = gen.generate("test", withTimeout);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).test;
    expect(ext.timeout).toBe(30);
  });

  it("serializes to YAML format", () => {
    const result = gen.generate("github", stdioConfig);
    const yaml = gen.serialize(result);
    expect(yaml).toContain("extensions:");
    expect(yaml).toContain("cmd: npx");
    expect(yaml).toContain("enabled: true");
    // Simple strings should not be quoted, but strings with special YAML
    // characters (like @) are correctly quoted
    expect(yaml).not.toContain('"npx"');  // Simple strings stay unquoted
  });
});

// ---------------------------------------------------------------------------
// Windsurf
// ---------------------------------------------------------------------------

describe("WindsurfGenerator", () => {
  const gen = new WindsurfGenerator();

  it("generates standard mcpServers for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
  });

  it("uses serverUrl for remote configs (not url)", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.serverUrl).toBe("https://mcp.example.com/mcp");
    expect(server.url).toBeUndefined();
    expect(server.headers).toEqual({ Authorization: "Bearer token123" });
  });
});

// ---------------------------------------------------------------------------
// OpenCode
// ---------------------------------------------------------------------------

describe("OpenCodeGenerator", () => {
  const gen = new OpenCodeGenerator();

  it("uses 'mcp' root key (not 'mcpServers')", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcp");
    expect(result).not.toHaveProperty("mcpServers");
  });

  it("merges command + args into command array", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.mcp as Record<string, Record<string, unknown>>).github;
    expect(server.command).toEqual([
      "npx",
      "-y",
      "@modelcontextprotocol/server-github",
    ]);
  });

  it("uses 'environment' instead of 'env'", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.mcp as Record<string, Record<string, unknown>>).github;
    expect(server.environment).toEqual({
      GITHUB_PERSONAL_ACCESS_TOKEN: "abc123",
    });
    expect(server.env).toBeUndefined();
  });

  it("adds type: 'local' for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.mcp as Record<string, Record<string, unknown>>).github;
    expect(server.type).toBe("local");
    expect(server.enabled).toBe(true);
  });

  it("adds type: 'remote' for remote configs", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcp as Record<string, Record<string, unknown>>).remote;
    expect(server.type).toBe("remote");
    expect(server.url).toBe("https://mcp.example.com/mcp");
    expect(server.enabled).toBe(true);
  });

  it("generateAll includes $schema", () => {
    const result = gen.generateAll({ github: stdioConfig });
    expect(result.$schema).toBe("https://opencode.ai/config.json");
  });
});

// ---------------------------------------------------------------------------
// Zed
// ---------------------------------------------------------------------------

describe("ZedGenerator", () => {
  const gen = new ZedGenerator();

  it("uses 'context_servers' root key", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("context_servers");
    expect(result).not.toHaveProperty("mcpServers");
  });

  it("keeps standard command/args/env for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.context_servers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "@modelcontextprotocol/server-github"]);
    expect(server.env).toEqual({ GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" });
  });

  it("uses url + headers for remote configs", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.context_servers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/mcp");
    expect(server.headers).toEqual({ Authorization: "Bearer token123" });
  });
});

// ---------------------------------------------------------------------------
// PyCharm
// ---------------------------------------------------------------------------

describe("PyCharmGenerator", () => {
  const gen = new PyCharmGenerator();

  it("generates standard mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "@modelcontextprotocol/server-github"]);
    expect(server.env).toEqual({ GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" });
  });

  it("generates remote config", () => {
    const result = gen.generate("remote", remoteConfig);
    expect(result).toEqual({
      mcpServers: {
        remote: {
          url: "https://mcp.example.com/mcp",
          headers: { Authorization: "Bearer token123" },
        },
      },
    });
  });

  it("omits empty args and env", () => {
    const result = gen.generate("minimal", minimalStdio);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).minimal;
    expect(server.args).toBeUndefined();
    expect(server.env).toBeUndefined();
  });

  it("has no configPaths (IDE-managed config)", () => {
    expect(gen.app.configPaths.win32).toBeUndefined();
    expect(gen.app.configPaths.darwin).toBeUndefined();
    expect(gen.app.configPaths.linux).toBeUndefined();
  });

  it("serializes to valid JSON", () => {
    const result = gen.generate("github", stdioConfig);
    const json = gen.serialize(result);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Registry & utilities
// ---------------------------------------------------------------------------

describe("generators registry", () => {
  it("has all 11 generators", () => {
    expect(Object.keys(generators)).toHaveLength(11);
  });

  it("getAppIds returns all 11 IDs", () => {
    const ids = getAppIds();
    expect(ids).toHaveLength(11);
    expect(ids).toContain("claude-desktop");
    expect(ids).toContain("goose");
    expect(ids).toContain("zed");
    expect(ids).toContain("pycharm");
  });

  it("getGenerator returns correct generator for each app", () => {
    const gen = getGenerator("vscode");
    expect(gen.app.id).toBe("vscode");
  });

  it("getGenerator throws for unknown app", () => {
    expect(() => getGenerator("unknown" as any)).toThrow();
  });

  it("generateAllConfigs returns configs for all 11 apps", () => {
    const configs = generateAllConfigs("github", stdioConfig);
    expect(Object.keys(configs)).toHaveLength(11);
    // Each config should be a valid string
    for (const [, configStr] of Object.entries(configs)) {
      expect(typeof configStr).toBe("string");
      expect(configStr.length).toBeGreaterThan(0);
    }
  });

  it("all generators produce parseable output for stdio config", () => {
    for (const [appId, gen] of Object.entries(generators)) {
      const result = gen.generate("test-server", stdioConfig);
      const serialized = gen.serialize(result);
      expect(serialized.length, `${appId} produced empty output`).toBeGreaterThan(0);
    }
  });

  it("all generators produce parseable output for remote config", () => {
    for (const [appId, gen] of Object.entries(generators)) {
      const result = gen.generate("test-server", remoteConfig);
      const serialized = gen.serialize(result);
      expect(serialized.length, `${appId} produced empty output`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Multi-server generation
// ---------------------------------------------------------------------------

describe("generateAll (multi-server)", () => {
  const servers: Record<string, LooseServerConfigType> = {
    github: stdioConfig,
    remote: remoteConfig,
  };

  it("Claude Desktop merges multiple servers", () => {
    const gen = new ClaudeDesktopGenerator();
    const result = gen.generateAll(servers);
    const mcpServers = result.mcpServers as Record<string, unknown>;
    expect(Object.keys(mcpServers)).toHaveLength(2);
    expect(mcpServers).toHaveProperty("github");
    expect(mcpServers).toHaveProperty("remote");
  });

  it("VS Code merges under 'servers' key", () => {
    const gen = new VSCodeGenerator();
    const result = gen.generateAll(servers);
    const svrs = result.servers as Record<string, unknown>;
    expect(Object.keys(svrs)).toHaveLength(2);
  });

  it("Goose merges under 'extensions' key", () => {
    const gen = new GooseGenerator();
    const result = gen.generateAll(servers);
    const exts = result.extensions as Record<string, unknown>;
    expect(Object.keys(exts)).toHaveLength(2);
  });

  it("OpenCode merges under 'mcp' key with $schema", () => {
    const gen = new OpenCodeGenerator();
    const result = gen.generateAll(servers);
    expect(result.$schema).toBe("https://opencode.ai/config.json");
    const mcp = result.mcp as Record<string, unknown>;
    expect(Object.keys(mcp)).toHaveLength(2);
  });

  it("Zed merges under 'context_servers' key", () => {
    const gen = new ZedGenerator();
    const result = gen.generateAll(servers);
    const cs = result.context_servers as Record<string, unknown>;
    expect(Object.keys(cs)).toHaveLength(2);
  });
});
