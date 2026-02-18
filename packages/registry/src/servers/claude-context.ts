import type { RegistryEntryType } from "@getmcp/core";

export const claudeContext: RegistryEntryType = {
  id: "claude-context",
  name: "Claude Context",
  description:
    "Code search MCP for AI coding agents. Index and search entire codebases using semantic and keyword search powered by vector embeddings",
  config: {
    command: "npx",
    args: ["-y", "@zilliz/claude-context-mcp@latest"],
    env: {
      OPENAI_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "@zilliz/claude-context-mcp",
  runtime: "node",
  repository: "https://github.com/zilliztech/claude-context",
  homepage: "https://github.com/zilliztech/claude-context",
  author: "Zilliz",
  categories: ["code-analysis", "search", "developer-tools"],
  requiredEnvVars: ["OPENAI_API_KEY"],
};
