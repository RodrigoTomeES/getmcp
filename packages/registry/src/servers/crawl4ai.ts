import type { RegistryEntryType } from "@getmcp/core";

export const crawl4ai: RegistryEntryType = {
  id: "crawl4ai",
  name: "Crawl4AI",
  description:
    "AI-optimized web crawler — crawl websites and extract structured content optimized for LLM consumption",
  config: {
    command: "uvx",
    args: ["crawl4ai-mcp"],
    env: {},
    transport: "stdio",
  },
  package: "crawl4ai-mcp",
  runtime: "python",
  repository: "https://github.com/unclecode/crawl4ai",
  homepage: "https://github.com/unclecode/crawl4ai",
  author: "unclecode",
  categories: ["web", "ai"],
  requiredEnvVars: [],
};
