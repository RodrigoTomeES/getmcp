import type { RegistryEntryType } from "@mcp-hub/core";

export const github: RegistryEntryType = {
  id: "github",
  name: "GitHub",
  description:
    "Repository management, file operations, issue tracking, and pull request management via the GitHub API",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-github",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
  author: "Anthropic",
  categories: ["developer-tools", "git", "version-control"],
  requiredEnvVars: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
};
