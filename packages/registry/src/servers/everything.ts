import type { RegistryEntryType } from "@getmcp/core";

export const everything: RegistryEntryType = {
  id: "everything",
  name: "Everything",
  description:
    "MCP test and reference server — implements all MCP capabilities for testing and development",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
    env: {},
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-everything",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
  author: "Anthropic",
  categories: ["developer-tools", "utilities"],
  requiredEnvVars: [],
};
