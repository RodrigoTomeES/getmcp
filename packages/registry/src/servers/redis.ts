import type { RegistryEntryType } from "@getmcp/core";

export const redis: RegistryEntryType = {
  id: "redis",
  name: "Redis",
  description:
    "Redis in-memory data store — get, set, delete keys, manage data structures, and monitor server info",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-redis", "redis://localhost:6379"],
    env: {},
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-redis",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers",
  author: "Anthropic",
  categories: ["data"],
  requiredEnvVars: [],
};
