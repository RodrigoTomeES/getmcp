import { describe, it, expect } from "vitest";
import { RegistryEntry } from "@getmcp/core";
import {
  getServer,
  getServerOrThrow,
  getServerIds,
  getAllServers,
  searchServers,
  getServersByCategory,
  getCategories,
  getServerCount,
  github,
  filesystem,
  braveSearch,
  memory,
  slack,
  postgres,
  puppeteer,
  sequentialThinking,
  sentry,
  context7,
  fetch,
  googleMaps,
  playwright,
  chromeDevtools,
  figma,
  firecrawl,
  browserTools,
  desktopCommander,
  repomix,
  gitMcp,
  n8nMcp,
  claudeContext,
  pdf2zh,
  unityMcp,
  idaPro,
  trendradar,
  mindsdb,
  genaiToolbox,
  scrapling,
  xiaohongshuMcp,
  awsDocs,
  nextDevtools,
  supabase,
  openaiDocs,
  shadcn,
  // Batch 1
  gitlab,
  linear,
  jira,
  notion,
  todoist,
  obsidian,
  terraform,
  kubernetes,
  dockerMcp,
  vercel,
  mysql,
  sqlite,
  mongodb,
  redis,
  elasticsearch,
  tavily,
  exa,
  perplexity,
  anthropic,
  openai,
  aws,
  cloudflare,
  gcp,
  azure,
  digitalocean,
  discord,
  telegram,
  email,
  stripe,
  twilio,
  airtable,
  shopify,
  youtube,
  twitter,
  time,
  // Batch 2
  bitbucket,
  asana,
  clickup,
  trello,
  snowflake,
  pinecone,
  neo4j,
  neon,
  dynamodb,
  confluence,
  snyk,
  vault,
  // Batch 3
  crawl4ai,
  browserbase,
  apify,
  huggingface,
  replicate,
  datadog,
  grafana,
  pagerduty,
  raycast,
  npmRegistry,
  bigquery,
  weaviate,
  // Batch 4
  sonarqube,
  langchain,
  llamaindex,
  togetherAi,
  prometheus,
  readme,
  swagger,
  zenrows,
  everart,
  everything,
  githubCopilot,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// All entries pass schema validation
// ---------------------------------------------------------------------------

describe("registry entries validate against schema", () => {
  const allServers = [
    github,
    filesystem,
    braveSearch,
    memory,
    slack,
    postgres,
    puppeteer,
    sequentialThinking,
    sentry,
    context7,
    fetch,
    googleMaps,
    playwright,
    chromeDevtools,
    figma,
    firecrawl,
    browserTools,
    desktopCommander,
    repomix,
    gitMcp,
    n8nMcp,
    claudeContext,
    pdf2zh,
    unityMcp,
    idaPro,
    trendradar,
    mindsdb,
    genaiToolbox,
    scrapling,
    xiaohongshuMcp,
    awsDocs,
    nextDevtools,
    supabase,
    openaiDocs,
    shadcn,
    // Batch 1
    gitlab,
    linear,
    jira,
    notion,
    todoist,
    obsidian,
    terraform,
    kubernetes,
    dockerMcp,
    vercel,
    mysql,
    sqlite,
    mongodb,
    redis,
    elasticsearch,
    tavily,
    exa,
    perplexity,
    anthropic,
    openai,
    aws,
    cloudflare,
    gcp,
    azure,
    digitalocean,
    discord,
    telegram,
    email,
    stripe,
    twilio,
    airtable,
    shopify,
    youtube,
    twitter,
    time,
    // Batch 2
    bitbucket,
    asana,
    clickup,
    trello,
    snowflake,
    pinecone,
    neo4j,
    neon,
    dynamodb,
    confluence,
    snyk,
    vault,
    // Batch 3
    crawl4ai,
    browserbase,
    apify,
    huggingface,
    replicate,
    datadog,
    grafana,
    pagerduty,
    raycast,
    npmRegistry,
    bigquery,
    weaviate,
    // Batch 4
    sonarqube,
    langchain,
    llamaindex,
    togetherAi,
    prometheus,
    readme,
    swagger,
    zenrows,
    everart,
    everything,
    githubCopilot,
  ];

  for (const server of allServers) {
    it(`${server.id} passes RegistryEntry validation`, () => {
      expect(() => RegistryEntry.parse(server)).not.toThrow();
    });
  }

  it("all entries have unique IDs", () => {
    const ids = allServers.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

describe("getServer", () => {
  it("returns a known server by ID", () => {
    const result = getServer("github");
    expect(result).toBeDefined();
    expect(result!.name).toBe("GitHub");
  });

  it("returns undefined for unknown ID", () => {
    expect(getServer("nonexistent")).toBeUndefined();
  });
});

describe("getServerOrThrow", () => {
  it("returns a known server by ID", () => {
    const result = getServerOrThrow("github");
    expect(result.name).toBe("GitHub");
  });

  it("throws for unknown ID with helpful message", () => {
    expect(() => getServerOrThrow("nonexistent")).toThrow(/not found in registry/);
    expect(() => getServerOrThrow("nonexistent")).toThrow(/Available:/);
  });
});

// ---------------------------------------------------------------------------
// Listing functions
// ---------------------------------------------------------------------------

describe("getServerIds", () => {
  it("returns all IDs sorted alphabetically", () => {
    const ids = getServerIds();
    expect(ids.length).toBe(105);
    // Verify sorted
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  it("includes known servers", () => {
    const ids = getServerIds();
    expect(ids).toContain("github");
    expect(ids).toContain("sentry");
    expect(ids).toContain("context7");
    expect(ids).toContain("fetch");
    // Batch 1 servers
    expect(ids).toContain("gitlab");
    expect(ids).toContain("tavily");
    expect(ids).toContain("cloudflare");
  });
});

describe("getAllServers", () => {
  it("returns all server entries", () => {
    const servers = getAllServers();
    expect(servers.length).toBe(105);
  });

  it("entries are sorted by ID", () => {
    const servers = getAllServers();
    const ids = servers.map((s) => s.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });
});

describe("getServerCount", () => {
  it("returns the correct count", () => {
    expect(getServerCount()).toBe(105);
  });
});

// ---------------------------------------------------------------------------
// Search functions
// ---------------------------------------------------------------------------

describe("searchServers", () => {
  it("returns all servers for empty query", () => {
    expect(searchServers("").length).toBe(105);
    expect(searchServers("  ").length).toBe(105);
  });

  it("finds servers by name", () => {
    const results = searchServers("GitHub");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((s) => s.id === "github")).toBe(true);
  });

  it("finds servers by description keywords", () => {
    const results = searchServers("database");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((s) => s.id === "postgres")).toBe(true);
  });

  it("finds servers by category", () => {
    const results = searchServers("automation");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((s) => s.id === "puppeteer")).toBe(true);
  });

  it("finds servers by author", () => {
    const results = searchServers("Anthropic");
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it("is case-insensitive", () => {
    const upper = searchServers("GITHUB");
    const lower = searchServers("github");
    expect(upper.length).toBe(lower.length);
  });

  it("returns empty for no match", () => {
    const results = searchServers("xyznonexistent");
    expect(results.length).toBe(0);
  });
});

describe("getServersByCategory", () => {
  it("finds servers by category", () => {
    const results = getServersByCategory("developer-tools");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some((s) => s.id === "github")).toBe(true);
  });

  it("is case-insensitive", () => {
    const results = getServersByCategory("Developer-Tools");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty for unknown category", () => {
    expect(getServersByCategory("nonexistent-category").length).toBe(0);
  });
});

describe("getCategories", () => {
  it("returns all unique categories sorted", () => {
    const categories = getCategories();
    expect(categories.length).toBeGreaterThan(5);
    // Verify sorted
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
    // Verify no duplicates
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });

  it("includes known categories", () => {
    const categories = getCategories();
    expect(categories).toContain("developer-tools");
    expect(categories).toContain("data");
    expect(categories).toContain("search");
    expect(categories).toContain("cloud");
    expect(categories).toContain("communication");
  });
});

// ---------------------------------------------------------------------------
// Server content checks
// ---------------------------------------------------------------------------

describe("server content integrity", () => {
  it("stdio servers have command field", () => {
    const stdioServers = getAllServers().filter((s) => "command" in s.config);
    expect(stdioServers.length).toBeGreaterThan(0);
    for (const server of stdioServers) {
      const config = server.config as { command: string };
      expect(config.command.length).toBeGreaterThan(0);
    }
  });

  it("remote servers have url field", () => {
    const remoteServers = getAllServers().filter((s) => "url" in s.config);
    expect(remoteServers.length).toBeGreaterThan(0);
    for (const server of remoteServers) {
      const config = server.config as { url: string };
      expect(config.url).toMatch(/^https?:\/\//);
    }
  });

  it("servers with requiredEnvVars have those vars in config.env", () => {
    for (const server of getAllServers()) {
      if (server.requiredEnvVars.length > 0 && "env" in server.config && server.config.env) {
        for (const envVar of server.requiredEnvVars) {
          expect(
            envVar in server.config.env,
            `${server.id}: required env var "${envVar}" not found in config.env`,
          ).toBe(true);
        }
      }
    }
  });
});
