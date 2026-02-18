import type { RegistryEntryType } from "@getmcp/core";

export const context7: RegistryEntryType = {
  id: "context7",
  name: "Context7",
  description:
    "Search and retrieve up-to-date documentation and code examples for libraries and frameworks",
  config: {
    url: "https://mcp.context7.com/mcp",
    transport: "http",
    headers: {},
  },
  runtime: "node",
  homepage: "https://context7.com",
  author: "Upstash",
  categories: ["documentation", "search", "developer-tools"],
  requiredEnvVars: [],
};
