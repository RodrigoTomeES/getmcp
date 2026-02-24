import { describe, it, expect } from "vitest";
import {
  StdioServerConfig,
  RemoteServerConfig,
  LooseServerConfig,
  CanonicalMCPConfig,
  RegistryEntry,
  AppId,
  ProjectManifest,
} from "../src/schemas.js";

// ---------------------------------------------------------------------------
// StdioServerConfig
// ---------------------------------------------------------------------------

describe("StdioServerConfig", () => {
  it("parses a minimal stdio config", () => {
    const result = StdioServerConfig.parse({ command: "npx" });
    expect(result.command).toBe("npx");
    expect(result.args).toEqual([]);
    expect(result.env).toEqual({});
    expect(result.transport).toBe("stdio");
  });

  it("parses a full stdio config", () => {
    const result = StdioServerConfig.parse({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: "abc123" },
      cwd: "/home/user",
      timeout: 30000,
      description: "GitHub MCP Server",
    });
    expect(result.command).toBe("npx");
    expect(result.args).toEqual(["-y", "@modelcontextprotocol/server-github"]);
    expect(result.env).toEqual({ GITHUB_TOKEN: "abc123" });
    expect(result.cwd).toBe("/home/user");
    expect(result.timeout).toBe(30000);
    expect(result.description).toBe("GitHub MCP Server");
  });

  it("rejects empty command", () => {
    expect(() => StdioServerConfig.parse({ command: "" })).toThrow();
  });

  it("rejects missing command", () => {
    expect(() => StdioServerConfig.parse({})).toThrow();
  });

  it("rejects negative timeout", () => {
    expect(() => StdioServerConfig.parse({ command: "npx", timeout: -1 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// RemoteServerConfig
// ---------------------------------------------------------------------------

describe("RemoteServerConfig", () => {
  it("parses a minimal remote config", () => {
    const result = RemoteServerConfig.parse({
      url: "https://mcp.example.com/mcp",
    });
    expect(result.url).toBe("https://mcp.example.com/mcp");
    expect(result.headers).toEqual({});
  });

  it("parses a full remote config", () => {
    const result = RemoteServerConfig.parse({
      url: "https://mcp.example.com/sse",
      transport: "sse",
      headers: { Authorization: "Bearer token123" },
      timeout: 60000,
      description: "Remote SSE server",
    });
    expect(result.url).toBe("https://mcp.example.com/sse");
    expect(result.transport).toBe("sse");
    expect(result.headers).toEqual({ Authorization: "Bearer token123" });
    expect(result.timeout).toBe(60000);
  });

  it("rejects invalid URL", () => {
    expect(() => RemoteServerConfig.parse({ url: "not-a-url" })).toThrow();
  });

  it("accepts all transport types", () => {
    for (const transport of ["http", "streamable-http", "sse"] as const) {
      const result = RemoteServerConfig.parse({
        url: "https://example.com/mcp",
        transport,
      });
      expect(result.transport).toBe(transport);
    }
  });
});

// ---------------------------------------------------------------------------
// LooseServerConfig (union)
// ---------------------------------------------------------------------------

describe("LooseServerConfig", () => {
  it("accepts a stdio config", () => {
    const result = LooseServerConfig.parse({
      command: "npx",
      args: ["-y", "my-server"],
    });
    expect("command" in result).toBe(true);
  });

  it("accepts a remote config", () => {
    const result = LooseServerConfig.parse({
      url: "https://example.com/mcp",
    });
    expect("url" in result).toBe(true);
  });

  it("rejects an empty object", () => {
    expect(() => LooseServerConfig.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CanonicalMCPConfig
// ---------------------------------------------------------------------------

describe("CanonicalMCPConfig", () => {
  it("parses a valid canonical config", () => {
    const result = CanonicalMCPConfig.parse({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "abc" },
        },
        remote: {
          url: "https://mcp.example.com/mcp",
        },
      },
    });
    expect(Object.keys(result.mcpServers)).toEqual(["github", "remote"]);
  });

  it("parses an empty config", () => {
    const result = CanonicalMCPConfig.parse({ mcpServers: {} });
    expect(result.mcpServers).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// RegistryEntry
// ---------------------------------------------------------------------------

describe("RegistryEntry", () => {
  it("parses a valid registry entry", () => {
    const result = RegistryEntry.parse({
      id: "github-mcp-server",
      name: "GitHub MCP Server",
      description: "GitHub integration for MCP",
      config: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
      },
      package: "@modelcontextprotocol/server-github",
      runtime: "node",
      repository: "https://github.com/modelcontextprotocol/servers",
      categories: ["developer-tools", "devops"],
      requiredEnvVars: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    });
    expect(result.id).toBe("github-mcp-server");
    expect(result.categories).toContain("developer-tools");
  });

  it("rejects invalid ID format", () => {
    expect(() =>
      RegistryEntry.parse({
        id: "Invalid ID",
        name: "Test",
        description: "Test",
        config: { command: "test" },
      }),
    ).toThrow();
  });

  it("requires id, name, description, config", () => {
    expect(() => RegistryEntry.parse({})).toThrow();
    expect(() => RegistryEntry.parse({ id: "test" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// AppId
// ---------------------------------------------------------------------------

describe("AppId", () => {
  it("accepts all 19 known app IDs", () => {
    const appIds = [
      "claude-desktop",
      "claude-code",
      "vscode",
      "cursor",
      "cline",
      "roo-code",
      "goose",
      "windsurf",
      "opencode",
      "zed",
      "pycharm",
      "codex",
      "gemini-cli",
      "continue",
      "amazon-q",
      "trae",
      "bolt-ai",
      "libre-chat",
    ];
    for (const id of appIds) {
      expect(AppId.parse(id)).toBe(id);
    }
  });

  it("rejects unknown app IDs", () => {
    expect(() => AppId.parse("unknown-app")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ProjectManifest
// ---------------------------------------------------------------------------

describe("ProjectManifest", () => {
  it("parses a valid manifest with empty overrides", () => {
    const result = ProjectManifest.parse({
      servers: { github: {}, memory: {} },
    });
    expect(Object.keys(result.servers)).toEqual(["github", "memory"]);
  });

  it("parses a manifest with env overrides", () => {
    const result = ProjectManifest.parse({
      servers: {
        github: { env: { GITHUB_TOKEN: "abc" } },
      },
    });
    expect(result.servers.github).toHaveProperty("env");
  });

  it("parses a manifest with app restrictions", () => {
    const result = ProjectManifest.parse({
      servers: {
        github: { apps: ["claude-desktop", "vscode"] },
      },
    });
    const entry = result.servers.github as { apps?: string[] };
    expect(entry.apps).toEqual(["claude-desktop", "vscode"]);
  });

  it("parses an empty manifest", () => {
    const result = ProjectManifest.parse({ servers: {} });
    expect(result.servers).toEqual({});
  });

  it("rejects manifest without servers key", () => {
    expect(() => ProjectManifest.parse({})).toThrow();
  });
});
