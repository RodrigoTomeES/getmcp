import type { RegistryEntryType } from "@getmcp/core";

export const gitMcp: RegistryEntryType = {
  id: "git-mcp",
  name: "GitMCP",
  description:
    "Free remote MCP server for any GitHub project. Provides up-to-date documentation and code context to reduce hallucinations in AI coding assistants",
  config: {
    url: "https://gitmcp.io",
    transport: "sse",
    headers: {},
  },
  homepage: "https://gitmcp.io",
  repository: "https://github.com/idosal/git-mcp",
  author: "idosal",
  categories: ["documentation", "developer-tools", "devops"],
  requiredEnvVars: [],
};
