import { describe, it, expect } from "vitest";
import { extractServerConfig } from "../src/extract-config.js";
import { transformToInternal } from "../src/transform.js";
import type { RegistryEntryType } from "@getmcp/core";

// ---------------------------------------------------------------------------
// extractServerConfig
// ---------------------------------------------------------------------------

describe("extractServerConfig", () => {
  it("extracts npm package as stdio config", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.github.test/my-server",
        description: "Test",
        packages: [
          {
            registryType: "npm",
            identifier: "@test/my-server",
            transport: { type: "stdio" },
            environmentVariables: [{ name: "API_KEY", isRequired: true, isSecret: true }],
          },
        ],
      },
      _meta: {},
    };

    const result = extractServerConfig(entry);
    expect(result).not.toBeNull();
    expect(result!.config).toHaveProperty("command", "npx");
    expect((result!.config as { args: string[] }).args).toContain("-y");
    expect((result!.config as { args: string[] }).args).toContain("@test/my-server");
    expect(result!.requiredEnvVars).toEqual(["API_KEY"]);
    expect(result!.envVarDetails[0]).toEqual({
      name: "API_KEY",
      description: undefined,
      isSecret: true,
      isRequired: true,
    });
  });

  it("extracts pypi package as stdio config", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.github.test/py-server",
        description: "Test",
        packages: [
          {
            registryType: "pypi",
            identifier: "my-py-server",
            transport: { type: "stdio" },
          },
        ],
      },
      _meta: {},
    };

    const result = extractServerConfig(entry);
    expect(result).not.toBeNull();
    expect(result!.config).toHaveProperty("command", "uvx");
    expect((result!.config as { args: string[] }).args).toContain("my-py-server");
  });

  it("extracts oci package as docker config", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.github.test/docker-server",
        description: "Test",
        packages: [
          {
            registryType: "oci",
            identifier: "test/docker-server",
            transport: { type: "stdio" },
            environmentVariables: [{ name: "TOKEN", isRequired: true }],
          },
        ],
      },
      _meta: {},
    };

    const result = extractServerConfig(entry);
    expect(result).not.toBeNull();
    expect(result!.config).toHaveProperty("command", "docker");
    const args = (result!.config as { args: string[] }).args;
    expect(args).toContain("run");
    expect(args).toContain("-i");
    expect(args).toContain("--rm");
    expect(args).toContain("test/docker-server");
  });

  it("extracts remote server", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.example/remote",
        description: "Test",
        remotes: [
          {
            type: "streamable-http",
            url: "https://example.com/mcp",
            headers: [
              { name: "Authorization", value: "Bearer token", isRequired: true, isSecret: true },
            ],
          },
        ],
      },
      _meta: {},
    };

    const result = extractServerConfig(entry);
    expect(result).not.toBeNull();
    expect(result!.config).toHaveProperty("url", "https://example.com/mcp");
    expect(result!.config).toHaveProperty("transport", "streamable-http");
  });

  it("returns null for entry with no packages or remotes", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.example/empty",
        description: "Test",
      },
      _meta: {},
    };

    expect(extractServerConfig(entry)).toBeNull();
  });

  it("uses runtimeHint for command when provided", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.github.test/server",
        description: "Test",
        packages: [
          {
            registryType: "npm",
            identifier: "@test/server",
            runtimeHint: "bunx",
            transport: { type: "stdio" },
          },
        ],
      },
      _meta: {},
    };

    const result = extractServerConfig(entry);
    expect(result!.config).toHaveProperty("command", "bunx");
  });
});

// ---------------------------------------------------------------------------
// transformToInternal
// ---------------------------------------------------------------------------

describe("transformToInternal", () => {
  it("transforms a complete entry", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.github.test/my-server",
        title: "My Server",
        description: "A test server",
        version: "1.0.0",
        repository: { url: "https://github.com/test/my-server", source: "github" },
        websiteUrl: "https://myserver.com",
        packages: [
          {
            registryType: "npm",
            identifier: "@test/my-server",
            transport: { type: "stdio" },
          },
        ],
      },
      _meta: {
        "es.getmcp/enrichment": {
          slug: "my-server",
          categories: ["developer-tools"],
          author: "TestOrg",
          license: "MIT",
          runtime: "node",
        },
      },
    };

    const result = transformToInternal(entry);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("io.github.test/my-server");
    expect(result!.slug).toBe("my-server");
    expect(result!.name).toBe("My Server");
    expect(result!.description).toBe("A test server");
    expect(result!.categories).toEqual(["developer-tools"]);
    expect(result!.author).toBe("TestOrg");
    expect(result!.license).toBe("MIT");
    expect(result!.runtime).toBe("node");
    expect(result!.repository).toBe("https://github.com/test/my-server");
    expect(result!.homepage).toBe("https://myserver.com");
  });

  it("returns null when no enrichment slug", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.example/no-enrichment",
        description: "Test",
        packages: [
          {
            registryType: "npm",
            identifier: "@test/pkg",
            transport: { type: "stdio" },
          },
        ],
      },
      _meta: {},
    };

    expect(transformToInternal(entry)).toBeNull();
  });

  it("propagates isOfficial from enrichment", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "com.stripe/mcp",
        description: "Stripe MCP server",
        packages: [
          {
            registryType: "npm",
            identifier: "@stripe/mcp",
            transport: { type: "stdio" },
          },
        ],
      },
      _meta: {
        "es.getmcp/enrichment": {
          slug: "stripe-mcp",
          categories: ["developer-tools"],
          isOfficial: true,
        },
      },
    };

    const result = transformToInternal(entry);
    expect(result).not.toBeNull();
    expect(result!.isOfficial).toBe(true);
  });

  it("defaults isOfficial to undefined when absent", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.github.test/my-server",
        title: "My Server",
        description: "A test server",
        packages: [
          {
            registryType: "npm",
            identifier: "@test/my-server",
            transport: { type: "stdio" },
          },
        ],
      },
      _meta: {
        "es.getmcp/enrichment": {
          slug: "my-server",
          categories: ["developer-tools"],
        },
      },
    };

    const result = transformToInternal(entry);
    expect(result).not.toBeNull();
    expect(result!.isOfficial).toBeUndefined();
  });

  it("returns null when no installable config", () => {
    const entry: RegistryEntryType = {
      server: {
        name: "io.example/no-config",
        description: "Test",
      },
      _meta: {
        "es.getmcp/enrichment": {
          slug: "no-config",
          categories: [],
        },
      },
    };

    expect(transformToInternal(entry)).toBeNull();
  });
});
