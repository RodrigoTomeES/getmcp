import type { RegistryEntryType } from "@getmcp/core";

export const firecrawl: RegistryEntryType = {
  id: "firecrawl",
  name: "Firecrawl",
  description:
    "Web scraping and search using Firecrawl. Crawl websites, extract content, scrape pages with JavaScript rendering, and perform web searches",
  config: {
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
    env: {
      FIRECRAWL_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "firecrawl-mcp",
  runtime: "node",
  repository: "https://github.com/firecrawl/firecrawl-mcp-server",
  homepage: "https://github.com/firecrawl/firecrawl-mcp-server",
  author: "Firecrawl",
  categories: ["web-scraping", "search", "web"],
  requiredEnvVars: ["FIRECRAWL_API_KEY"],
};
