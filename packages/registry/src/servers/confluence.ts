import type { RegistryEntryType } from "@getmcp/core";

export const confluence: RegistryEntryType = {
  id: "confluence",
  name: "Confluence",
  description: "Atlassian Confluence wiki — search, read, create, and update pages and spaces",
  config: {
    command: "npx",
    args: [
      "-y",
      "mcp-atlassian",
      "--confluence-url",
      "https://your-domain.atlassian.net/wiki",
      "--confluence-email",
      "your-email@example.com",
    ],
    env: {
      CONFLUENCE_API_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-atlassian",
  runtime: "node",
  repository: "https://github.com/sooperset/mcp-atlassian",
  homepage: "https://github.com/sooperset/mcp-atlassian",
  author: "sooperset",
  categories: ["documentation", "developer-tools"],
  requiredEnvVars: ["CONFLUENCE_API_TOKEN"],
};
