import type { RegistryEntryType } from "@getmcp/core";

export const sequentialThinking: RegistryEntryType = {
  id: "sequential-thinking",
  name: "Sequential Thinking",
  description:
    "Dynamic and reflective problem-solving through structured sequential thinking. Helps break down complex tasks into manageable steps",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    env: {},
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-sequential-thinking",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
  author: "Anthropic",
  categories: ["reasoning", "utilities"],
  requiredEnvVars: [],
};
