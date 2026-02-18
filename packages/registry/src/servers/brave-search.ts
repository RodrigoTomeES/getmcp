import type { RegistryEntryType } from "@getmcp/core";

export const braveSearch: RegistryEntryType = {
  id: "brave-search",
  name: "Brave Search",
  description:
    "Web and local search capabilities using the Brave Search API",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: {
      BRAVE_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-brave-search",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
  author: "Anthropic",
  categories: ["search", "web"],
  requiredEnvVars: ["BRAVE_API_KEY"],
};
