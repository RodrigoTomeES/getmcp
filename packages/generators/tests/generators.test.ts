import { describe, it, expect } from "vitest";
import YAML from "yaml";
import * as TOML from "smol-toml";
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
  CodexGenerator,
  GeminiCliGenerator,
  ContinueGenerator,
  AmazonQGenerator,
  TraeGenerator,
  VSCodeInsidersGenerator,
  BoltAIGenerator,
  LibreChatGenerator,
  AntigravityGenerator,
  generators,
  getGenerator,
  getAppIds,
  generateAllConfigs,
  deepMerge,
  toStdioFields,
  toRemoteFields,
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

const stdioWithDescription: LooseServerConfigType = {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" },
  transport: "stdio",
  description: "GitHub MCP Server",
};

const remoteWithTimeout: LooseServerConfigType = {
  url: "https://mcp.example.com/mcp",
  headers: { Authorization: "Bearer token123" },
  timeout: 30000,
};

const remoteWithDescription: LooseServerConfigType = {
  url: "https://mcp.example.com/mcp",
  headers: { Authorization: "Bearer token123" },
  description: "Remote MCP server",
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
// Description preservation (cross-generator)
// ---------------------------------------------------------------------------

describe("description field preservation", () => {
  it("toStdioFields includes description", () => {
    const gen = new ClaudeDesktopGenerator();
    const result = gen.generate("github", stdioWithDescription);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.description).toBe("GitHub MCP Server");
  });

  it("toRemoteFields includes description", () => {
    const gen = new ClaudeDesktopGenerator();
    const result = gen.generate("remote", remoteWithDescription);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.description).toBe("Remote MCP server");
  });

  it("Goose stdio preserves description", () => {
    const gen = new GooseGenerator();
    const result = gen.generate("github", stdioWithDescription);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).github;
    expect(ext.description).toBe("GitHub MCP Server");
  });

  it("Goose remote preserves description", () => {
    const gen = new GooseGenerator();
    const result = gen.generate("remote", remoteWithDescription);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).remote;
    expect(ext.description).toBe("Remote MCP server");
  });

  it("OpenCode stdio preserves description", () => {
    const gen = new OpenCodeGenerator();
    const result = gen.generate("github", stdioWithDescription);
    const server = (result.mcp as Record<string, Record<string, unknown>>).github;
    expect(server.description).toBe("GitHub MCP Server");
  });

  it("OpenCode remote preserves description", () => {
    const gen = new OpenCodeGenerator();
    const result = gen.generate("remote", remoteWithDescription);
    const server = (result.mcp as Record<string, Record<string, unknown>>).remote;
    expect(server.description).toBe("Remote MCP server");
  });

  it("Codex stdio preserves description", () => {
    const gen = new CodexGenerator();
    const result = gen.generate("github", stdioWithDescription);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).github;
    expect(server.description).toBe("GitHub MCP Server");
  });

  it("Codex remote preserves description", () => {
    const gen = new CodexGenerator();
    const result = gen.generate("remote", remoteWithDescription);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).remote;
    expect(server.description).toBe("Remote MCP server");
  });
});

// ---------------------------------------------------------------------------
// Timeout forwarding for remote configs
// ---------------------------------------------------------------------------

describe("timeout forwarding for remote configs", () => {
  it("Cline forwards timeout for remote", () => {
    const gen = new ClineGenerator();
    const result = gen.generate("remote", remoteWithTimeout);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.timeout).toBe(30000);
  });

  it("Roo Code forwards timeout for remote", () => {
    const gen = new RooCodeGenerator();
    const result = gen.generate("remote", remoteWithTimeout);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.timeout).toBe(30000);
  });

  it("Windsurf forwards timeout for remote", () => {
    const gen = new WindsurfGenerator();
    const result = gen.generate("remote", remoteWithTimeout);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.timeout).toBe(30000);
  });

  it("Zed forwards timeout for remote", () => {
    const gen = new ZedGenerator();
    const result = gen.generate("remote", remoteWithTimeout);
    const server = (result.context_servers as Record<string, Record<string, unknown>>).remote;
    expect(server.timeout).toBe(30000);
  });
});

// ---------------------------------------------------------------------------
// Goose remote headers fix
// ---------------------------------------------------------------------------

describe("Goose remote headers", () => {
  it("uses headers (not envs) for remote config", () => {
    const gen = new GooseGenerator();
    const result = gen.generate("remote", remoteConfig);
    const ext = (result.extensions as Record<string, Record<string, unknown>>).remote;
    expect(ext.headers).toEqual({ Authorization: "Bearer token123" });
    expect(ext.envs).toBeUndefined();
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
    expect(yaml).not.toContain('"npx"'); // Simple strings stay unquoted
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
    expect(server.command).toEqual(["npx", "-y", "@modelcontextprotocol/server-github"]);
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

  it("has project-level configPaths", () => {
    expect(gen.app.configPaths).toBe(".ai/mcp/mcp.json");
    expect(gen.app.globalConfigPaths).toBeNull();
  });

  it("serializes to valid JSON", () => {
    const result = gen.generate("github", stdioConfig);
    const json = gen.serialize(result);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Codex (OpenAI)
// ---------------------------------------------------------------------------

describe("CodexGenerator", () => {
  const gen = new CodexGenerator();

  it("uses 'mcp_servers' root key (not 'mcpServers')", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcp_servers");
    expect(result).not.toHaveProperty("mcpServers");
  });

  it("preserves command, args, env for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "@modelcontextprotocol/server-github"]);
    expect(server.env).toEqual({ GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" });
  });

  it("renames headers to http_headers for remote", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/mcp");
    expect(server.http_headers).toEqual({ Authorization: "Bearer token123" });
    expect(server.headers).toBeUndefined();
  });

  it("drops transport field", () => {
    const result = gen.generate("remote", sseConfig);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).remote;
    expect(server.transport).toBeUndefined();
    expect(server.type).toBeUndefined();
  });

  it("converts timeout from ms to seconds (startup_timeout_sec)", () => {
    const withTimeout: LooseServerConfigType = {
      command: "npx",
      args: [],
      env: {},
      transport: "stdio",
      timeout: 30000,
    };
    const result = gen.generate("test", withTimeout);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).test;
    expect(server.startup_timeout_sec).toBe(30);
    expect(server.timeout).toBeUndefined();
  });

  it("rounds up timeout when not evenly divisible", () => {
    const withTimeout: LooseServerConfigType = {
      command: "npx",
      args: [],
      env: {},
      transport: "stdio",
      timeout: 1500,
    };
    const result = gen.generate("test", withTimeout);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).test;
    expect(server.startup_timeout_sec).toBe(2);
  });

  it("omits empty args and env", () => {
    const result = gen.generate("minimal", minimalStdio);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).minimal;
    expect(server.args).toBeUndefined();
    expect(server.env).toBeUndefined();
  });

  it("omits empty headers for remote", () => {
    const result = gen.generate("remote", sseConfig);
    const server = (result.mcp_servers as Record<string, Record<string, unknown>>).remote;
    expect(server.http_headers).toBeUndefined();
  });

  it("serializes to TOML format", () => {
    const result = gen.generate("github", stdioConfig);
    const toml = gen.serialize(result);
    expect(toml).toContain("[mcp_servers.github]");
    expect(toml).toContain('command = "npx"');
    expect(toml).toContain("[mcp_servers.github.env]");
    expect(toml).toContain('GITHUB_PERSONAL_ACCESS_TOKEN = "abc123"');
  });

  it("serializes remote config to TOML with http_headers table", () => {
    const result = gen.generate("remote", remoteConfig);
    const toml = gen.serialize(result);
    expect(toml).toContain("[mcp_servers.remote]");
    expect(toml).toContain('url = "https://mcp.example.com/mcp"');
    expect(toml).toContain("[mcp_servers.remote.http_headers]");
    expect(toml).toContain('Authorization = "Bearer token123"');
  });

  it("has TOML config format", () => {
    expect(gen.app.configFormat).toBe("toml");
  });

  it("has correct config paths", () => {
    expect(gen.app.configPaths).toBe(".codex/config.toml");
    expect(gen.app.globalConfigPaths).not.toBeNull();
    expect(gen.app.globalConfigPaths!.darwin).toBe("~/.codex/config.toml");
    expect(gen.app.globalConfigPaths!.linux).toBe("~/.codex/config.toml");
    expect(gen.app.globalConfigPaths!.win32).toBe("%UserProfile%\\.codex\\config.toml");
  });
});

// ---------------------------------------------------------------------------
// Gemini CLI
// ---------------------------------------------------------------------------

describe("GeminiCliGenerator", () => {
  const gen = new GeminiCliGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
  });

  it("generates remote config", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/mcp");
  });
});

// ---------------------------------------------------------------------------
// Continue
// ---------------------------------------------------------------------------

describe("ContinueGenerator", () => {
  const gen = new ContinueGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
  });

  it("generates remote config", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/mcp");
  });
});

// ---------------------------------------------------------------------------
// Amazon Q Developer
// ---------------------------------------------------------------------------

describe("AmazonQGenerator", () => {
  const gen = new AmazonQGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
  });

  it("generates remote config", () => {
    const result = gen.generate("remote", remoteConfig);
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/mcp");
  });
});

// ---------------------------------------------------------------------------
// Trae
// ---------------------------------------------------------------------------

describe("TraeGenerator", () => {
  const gen = new TraeGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
  });

  it("is project-scoped", () => {
    expect(gen.app.configPaths).not.toBeNull();
    expect(gen.app.globalConfigPaths).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// VS Code Insiders
// ---------------------------------------------------------------------------

describe("VSCodeInsidersGenerator", () => {
  const gen = new VSCodeInsidersGenerator();

  it("uses 'servers' root key (same as VS Code)", () => {
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
  });

  it("uses .vscode-insiders config path", () => {
    expect(gen.app.configPaths).toBe(".vscode-insiders/mcp.json");
  });
});

// ---------------------------------------------------------------------------
// BoltAI
// ---------------------------------------------------------------------------

describe("BoltAIGenerator", () => {
  const gen = new BoltAIGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
  });

  it("is macOS only", () => {
    expect(gen.app.configPaths).toBeNull();
    expect(gen.app.globalConfigPaths).not.toBeNull();
    expect(gen.app.globalConfigPaths!.darwin).toBeDefined();
    expect(gen.app.globalConfigPaths!.win32).toBeUndefined();
    expect(gen.app.globalConfigPaths!.linux).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// LibreChat
// ---------------------------------------------------------------------------

describe("LibreChatGenerator", () => {
  const gen = new LibreChatGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
  });

  it("serializes to YAML format", () => {
    const result = gen.generate("github", stdioConfig);
    const yaml = gen.serialize(result);
    expect(yaml).toContain("mcpServers:");
    expect(yaml).toContain("command: npx");
  });

  it("YAML round-trips correctly", () => {
    const result = gen.generate("github", stdioConfig);
    const serialized = gen.serialize(result);
    const parsed = YAML.parse(serialized);
    expect(parsed).toEqual(result);
  });

  it("has yaml config format", () => {
    expect(gen.app.configFormat).toBe("yaml");
  });
});

// ---------------------------------------------------------------------------
// Antigravity
// ---------------------------------------------------------------------------

describe("AntigravityGenerator", () => {
  const gen = new AntigravityGenerator();

  it("generates mcpServers format for stdio", () => {
    const result = gen.generate("github", stdioConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).github;
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "@modelcontextprotocol/server-github"]);
    expect(server.env).toEqual({ GITHUB_PERSONAL_ACCESS_TOKEN: "abc123" });
  });

  it("generates mcpServers format for remote", () => {
    const result = gen.generate("remote", remoteConfig);
    expect(result).toHaveProperty("mcpServers");
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).remote;
    expect(server.url).toBe("https://mcp.example.com/mcp");
    expect(server.headers).toEqual({ Authorization: "Bearer token123" });
  });

  it("omits empty args and env", () => {
    const result = gen.generate("minimal", { command: "server", transport: "stdio" });
    const server = (result.mcpServers as Record<string, Record<string, unknown>>).minimal;
    expect(server.command).toBe("server");
    expect(server.args).toBeUndefined();
    expect(server.env).toBeUndefined();
  });

  it("serializes to valid JSON", () => {
    const result = gen.generate("github", stdioConfig);
    const serialized = gen.serialize(result);
    const parsed = JSON.parse(serialized);
    expect(parsed).toEqual(result);
  });
});

// ---------------------------------------------------------------------------
// Registry & utilities
// ---------------------------------------------------------------------------

describe("generators registry", () => {
  it("has all 20 generators", () => {
    expect(Object.keys(generators)).toHaveLength(20);
  });

  it("getAppIds returns all 20 IDs", () => {
    const ids = getAppIds();
    expect(ids).toHaveLength(20);
    expect(ids).toContain("claude-desktop");
    expect(ids).toContain("goose");
    expect(ids).toContain("zed");
    expect(ids).toContain("pycharm");
    expect(ids).toContain("codex");
    expect(ids).toContain("gemini-cli");
    expect(ids).toContain("continue");
    expect(ids).toContain("amazon-q");
    expect(ids).toContain("trae");
    expect(ids).toContain("vscode-insiders");
    expect(ids).toContain("bolt-ai");
    expect(ids).toContain("libre-chat");
    expect(ids).toContain("antigravity");
  });

  it("getGenerator returns correct generator for each app", () => {
    const gen = getGenerator("vscode");
    expect(gen.app.id).toBe("vscode");
  });

  it("getGenerator throws for unknown app", () => {
    expect(() => getGenerator("unknown" as any)).toThrow();
  });

  it("generateAllConfigs returns configs for all 20 apps", () => {
    const configs = generateAllConfigs("github", stdioConfig);
    expect(Object.keys(configs)).toHaveLength(20);
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

  it("Codex merges under 'mcp_servers' key", () => {
    const gen = new CodexGenerator();
    const result = gen.generateAll(servers);
    const mcpServers = result.mcp_servers as Record<string, unknown>;
    expect(Object.keys(mcpServers)).toHaveLength(2);
    expect(mcpServers).toHaveProperty("github");
    expect(mcpServers).toHaveProperty("remote");
  });
});

// ---------------------------------------------------------------------------
// Generator serialize → parse round-trip tests
// ---------------------------------------------------------------------------

describe("serialize → parse round-trip", () => {
  it("Goose: serialized YAML can be parsed back to equivalent object", () => {
    const gen = new GooseGenerator();
    const result = gen.generate("github", stdioConfig);
    const serialized = gen.serialize(result);
    const parsed = YAML.parse(serialized);
    expect(parsed).toEqual(result);
  });

  it("Goose: multi-server serialized YAML is parseable", () => {
    const gen = new GooseGenerator();
    const result = gen.generateAll({ github: stdioConfig, remote: remoteConfig });
    const serialized = gen.serialize(result);
    const parsed = YAML.parse(serialized);
    expect(parsed).toEqual(result);
  });

  it("Codex: serialized TOML can be parsed back to equivalent object", () => {
    const gen = new CodexGenerator();
    const result = gen.generate("github", stdioConfig);
    const serialized = gen.serialize(result);
    const parsed = TOML.parse(serialized);
    expect(parsed).toEqual(result);
  });

  it("Codex: multi-server serialized TOML is parseable", () => {
    const gen = new CodexGenerator();
    const result = gen.generateAll({ github: stdioConfig, remote: remoteConfig });
    const serialized = gen.serialize(result);
    const parsed = TOML.parse(serialized);
    expect(parsed).toEqual(result);
  });

  it("Codex: remote config with http_headers round-trips through TOML", () => {
    const gen = new CodexGenerator();
    const result = gen.generate("remote", remoteConfig);
    const serialized = gen.serialize(result);
    const parsed = TOML.parse(serialized);
    expect(parsed).toEqual(result);
  });

  it("All JSON generators produce parseable JSON round-trip", () => {
    const jsonGenerators = Object.entries(generators).filter(
      ([, gen]) => gen.app.configFormat === "json" || gen.app.configFormat === "jsonc",
    );
    for (const [appId, gen] of jsonGenerators) {
      const result = gen.generate("test-server", stdioConfig);
      const serialized = gen.serialize(result);
      const parsed = JSON.parse(serialized);
      expect(parsed, `${appId} JSON round-trip failed`).toEqual(result);
    }
  });
});

// ---------------------------------------------------------------------------
// detectInstalled()
// ---------------------------------------------------------------------------

describe("detectInstalled", () => {
  it("all generators have detectInstalled() method", () => {
    for (const [appId, gen] of Object.entries(generators)) {
      expect(typeof gen.detectInstalled, `${appId} missing detectInstalled`).toBe("function");
    }
  });

  it("detectInstalled() returns a boolean for all generators", () => {
    for (const [appId, gen] of Object.entries(generators)) {
      const result = gen.detectInstalled();
      expect(typeof result, `${appId} detectInstalled() should return boolean`).toBe("boolean");
    }
  });

  it("pycharm returns false (not overridden)", () => {
    const gen = new PyCharmGenerator();
    expect(gen.detectInstalled()).toBe(false);
  });

  it("libre-chat returns false (not overridden)", () => {
    const gen = new LibreChatGenerator();
    expect(gen.detectInstalled()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deepMerge edge cases
// ---------------------------------------------------------------------------

describe("deepMerge", () => {
  it("merges flat objects", () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("overwrites primitive values", () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it("deep merges nested objects", () => {
    const result = deepMerge(
      { mcpServers: { github: { command: "npx" } } },
      { mcpServers: { slack: { command: "npx" } } },
    );
    expect(result).toEqual({
      mcpServers: { github: { command: "npx" }, slack: { command: "npx" } },
    });
  });

  it("replaces arrays (does not merge)", () => {
    const result = deepMerge({ args: ["a", "b"] }, { args: ["c"] });
    expect(result).toEqual({ args: ["c"] });
  });

  it("handles empty target", () => {
    const result = deepMerge({}, { a: 1 });
    expect(result).toEqual({ a: 1 });
  });

  it("handles empty source", () => {
    const result = deepMerge({ a: 1 }, {});
    expect(result).toEqual({ a: 1 });
  });

  it("does not mutate original objects", () => {
    const target = { a: 1, nested: { b: 2 } };
    const source = { nested: { c: 3 } };
    deepMerge(target, source);
    expect(target).toEqual({ a: 1, nested: { b: 2 } });
    expect(source).toEqual({ nested: { c: 3 } });
  });
});

// ---------------------------------------------------------------------------
// toStdioFields / toRemoteFields error paths
// ---------------------------------------------------------------------------

describe("toStdioFields error handling", () => {
  it("throws for remote config", () => {
    expect(() => toStdioFields({ url: "https://example.com", headers: {} } as any)).toThrow(
      "Expected stdio config",
    );
  });
});

describe("toRemoteFields error handling", () => {
  it("throws for stdio config", () => {
    expect(() => toRemoteFields({ command: "npx", args: [], env: {} } as any)).toThrow(
      "Expected remote config",
    );
  });
});
