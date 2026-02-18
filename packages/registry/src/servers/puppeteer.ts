import type { RegistryEntryType } from "@getmcp/core";

export const puppeteer: RegistryEntryType = {
  id: "puppeteer",
  name: "Puppeteer",
  description:
    "Browser automation and web scraping using Puppeteer. Navigate pages, take screenshots, click elements, and extract content",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    env: {},
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-puppeteer",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
  author: "Anthropic",
  categories: ["browser", "automation", "web-scraping"],
  requiredEnvVars: [],
};
