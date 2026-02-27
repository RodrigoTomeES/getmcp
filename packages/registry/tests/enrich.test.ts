import { describe, it, expect } from "vitest";
import {
  mapTopicsToCategories,
  inferRuntime,
  parseGitHubUrl,
  buildEnrichment,
} from "../src/enrich.js";

describe("mapTopicsToCategories", () => {
  it("maps known topics to categories", () => {
    expect(mapTopicsToCategories(["github", "git"])).toEqual(["developer-tools"]);
  });

  it("maps multiple topics to multiple categories", () => {
    const result = mapTopicsToCategories(["github", "database", "ai"]);
    expect(result).toContain("developer-tools");
    expect(result).toContain("data");
    expect(result).toContain("ai");
  });

  it("deduplicates categories", () => {
    const result = mapTopicsToCategories(["github", "git", "gitlab"]);
    expect(result).toEqual(["developer-tools"]);
  });

  it("returns sorted results", () => {
    const result = mapTopicsToCategories(["web", "ai", "data"]);
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it("returns empty for unknown topics", () => {
    expect(mapTopicsToCategories(["unknown-topic-xyz"])).toEqual([]);
  });

  it("ignores empty array", () => {
    expect(mapTopicsToCategories([])).toEqual([]);
  });
});

describe("inferRuntime", () => {
  it("returns node for npm", () => {
    expect(inferRuntime("npm")).toBe("node");
  });

  it("returns python for pypi", () => {
    expect(inferRuntime("pypi")).toBe("python");
  });

  it("returns docker for oci", () => {
    expect(inferRuntime("oci")).toBe("docker");
  });

  it("infers from language when no registryType", () => {
    expect(inferRuntime(undefined, "TypeScript")).toBe("node");
    expect(inferRuntime(undefined, "Python")).toBe("python");
    expect(inferRuntime(undefined, "Go")).toBe("binary");
    expect(inferRuntime(undefined, "Rust")).toBe("binary");
  });

  it("returns undefined when no signals", () => {
    expect(inferRuntime(undefined, undefined)).toBeUndefined();
  });
});

describe("parseGitHubUrl", () => {
  it("parses standard GitHub URL", () => {
    const result = parseGitHubUrl("https://github.com/getsentry/sentry-mcp");
    expect(result).toEqual({ owner: "getsentry", repo: "sentry-mcp" });
  });

  it("strips .git suffix", () => {
    const result = parseGitHubUrl("https://github.com/test/repo.git");
    expect(result).toEqual({ owner: "test", repo: "repo" });
  });

  it("returns null for non-GitHub URL", () => {
    expect(parseGitHubUrl("https://gitlab.com/test/repo")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseGitHubUrl("not-a-url")).toBeNull();
  });

  it("returns null for GitHub URL without repo", () => {
    expect(parseGitHubUrl("https://github.com/only-owner")).toBeNull();
  });
});

describe("buildEnrichment", () => {
  it("builds enrichment from GitHub repo info", () => {
    const result = buildEnrichment(
      "test",
      {
        stargazers_count: 100,
        forks_count: 10,
        open_issues_count: 5,
        license: { spdx_id: "MIT" },
        language: "TypeScript",
        topics: ["ai", "mcp"],
        pushed_at: "2025-01-01T00:00:00Z",
        archived: false,
        owner: { login: "testorg", type: "Organization" },
      },
      "npm",
    );

    expect(result.slug).toBe("test");
    expect(result.author).toBe("testorg");
    expect(result.license).toBe("MIT");
    expect(result.language).toBe("TypeScript");
    expect(result.runtime).toBe("node");
    expect(result.categories).toContain("ai");
  });

  it("handles null repo info", () => {
    const result = buildEnrichment("test", null, "npm");
    expect(result.slug).toBe("test");
    expect(result.author).toBeUndefined();
    expect(result.runtime).toBe("node"); // Inferred from registryType
  });
});
