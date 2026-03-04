import { describe, it, expect } from "vitest";
import {
  StdioServerConfig,
  RemoteServerConfig,
  LooseServerConfig,
  CanonicalMCPConfig,
  RegistryEntry,
  AppId,
  ProjectManifest,
  RegistryAuthMethod,
  RegistrySource,
  RegistryCredential,
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
// RegistryEntry (official format)
// ---------------------------------------------------------------------------

describe("RegistryEntry", () => {
  it("parses a valid registry entry with packages", () => {
    const result = RegistryEntry.parse({
      server: {
        name: "io.github.example/test-server",
        description: "A test server",
        version: "1.0.0",
        packages: [
          {
            registryType: "npm",
            identifier: "@example/test-server",
            transport: { type: "stdio" },
            environmentVariables: [{ name: "API_KEY", isRequired: true, isSecret: true }],
          },
        ],
      },
      _meta: {
        "es.getmcp/enrichment": {
          slug: "test-server",
          categories: ["developer-tools"],
        },
      },
    });
    expect(result.server.name).toBe("io.github.example/test-server");
    expect(result.server.packages).toHaveLength(1);
  });

  it("parses a valid registry entry with remotes", () => {
    const result = RegistryEntry.parse({
      server: {
        name: "io.example/remote-server",
        description: "A remote server",
        remotes: [
          {
            type: "streamable-http",
            url: "https://example.com/mcp",
          },
        ],
      },
    });
    expect(result.server.remotes).toHaveLength(1);
  });

  it("parses with _meta enrichment and metrics", () => {
    const result = RegistryEntry.parse({
      server: {
        name: "io.github.test/server",
        description: "Test",
      },
      _meta: {
        "io.modelcontextprotocol.registry/official": {
          status: "active",
          publishedAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          isLatest: true,
        },
        "es.getmcp/enrichment": {
          slug: "test",
          categories: ["ai", "data"],
          author: "TestOrg",
          license: "MIT",
        },
        "es.getmcp/metrics": {
          github: { stars: 100, forks: 10 },
          npm: { weeklyDownloads: 5000 },
          fetchedAt: "2025-01-01T00:00:00Z",
        },
      },
    });
    expect(result._meta).toBeDefined();
  });

  it("requires server.name and server.description", () => {
    expect(() => RegistryEntry.parse({ server: {} })).toThrow();
    expect(() => RegistryEntry.parse({ server: { name: "test" } })).toThrow();
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

  it("parses a manifest with registries", () => {
    const result = ProjectManifest.parse({
      servers: { github: {} },
      registries: [
        { name: "company", url: "https://registry.company.com", type: "private", priority: 50 },
      ],
    });
    expect(result.registries).toHaveLength(1);
    expect(result.registries![0].name).toBe("company");
  });

  it("parses a manifest with server registry override", () => {
    const result = ProjectManifest.parse({
      servers: {
        "my-server": { registry: "company" },
      },
    });
    const entry = result.servers["my-server"] as { registry?: string };
    expect(entry.registry).toBe("company");
  });
});

// ---------------------------------------------------------------------------
// RegistryAuthMethod
// ---------------------------------------------------------------------------

describe("RegistryAuthMethod", () => {
  it("accepts valid auth methods", () => {
    for (const method of ["bearer", "basic", "header"]) {
      expect(RegistryAuthMethod.parse(method)).toBe(method);
    }
  });

  it("rejects invalid auth methods", () => {
    expect(() => RegistryAuthMethod.parse("oauth")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// RegistrySource
// ---------------------------------------------------------------------------

describe("RegistrySource", () => {
  it("parses a valid public registry source", () => {
    const result = RegistrySource.parse({
      name: "company",
      url: "https://registry.company.com",
    });
    expect(result.name).toBe("company");
    expect(result.url).toBe("https://registry.company.com");
    expect(result.type).toBe("public");
    expect(result.priority).toBe(100);
  });

  it("parses a valid private registry source", () => {
    const result = RegistrySource.parse({
      name: "my-private",
      url: "https://private.example.com",
      type: "private",
      priority: 50,
    });
    expect(result.type).toBe("private");
    expect(result.priority).toBe(50);
  });

  it("rejects names with uppercase", () => {
    expect(() => RegistrySource.parse({ name: "Company", url: "https://example.com" })).toThrow();
  });

  it("rejects names with spaces", () => {
    expect(() =>
      RegistrySource.parse({ name: "my registry", url: "https://example.com" }),
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() => RegistrySource.parse({ name: "", url: "https://example.com" })).toThrow();
  });

  it("rejects invalid URL", () => {
    expect(() => RegistrySource.parse({ name: "test", url: "not-a-url" })).toThrow();
  });

  it("rejects negative priority", () => {
    expect(() =>
      RegistrySource.parse({ name: "test", url: "https://example.com", priority: -1 }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// RegistryCredential
// ---------------------------------------------------------------------------

describe("RegistryCredential", () => {
  it("parses a bearer credential", () => {
    const result = RegistryCredential.parse({
      method: "bearer",
      token: "my-token",
    });
    expect(result.method).toBe("bearer");
    expect(result.token).toBe("my-token");
  });

  it("parses a basic credential", () => {
    const result = RegistryCredential.parse({
      method: "basic",
      username: "user",
      token: "pass",
    });
    expect(result.method).toBe("basic");
    expect(result.username).toBe("user");
  });

  it("parses a header credential", () => {
    const result = RegistryCredential.parse({
      method: "header",
      headerName: "X-API-Key",
      token: "key123",
    });
    expect(result.method).toBe("header");
    expect(result.headerName).toBe("X-API-Key");
  });

  it("rejects invalid method", () => {
    expect(() => RegistryCredential.parse({ method: "oauth" })).toThrow();
  });
});
