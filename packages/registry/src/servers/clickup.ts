import type { RegistryEntryType } from "@getmcp/core";

export const clickup: RegistryEntryType = {
  id: "clickup",
  name: "ClickUp",
  description: "ClickUp productivity platform — manage tasks, docs, goals, and workspaces",
  config: {
    command: "npx",
    args: ["-y", "mcp-clickup"],
    env: {
      CLICKUP_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "mcp-clickup",
  runtime: "node",
  repository: "https://github.com/nazrulworld/mcp-clickup",
  homepage: "https://github.com/nazrulworld/mcp-clickup",
  author: "nazrulworld",
  categories: ["developer-tools", "automation"],
  requiredEnvVars: ["CLICKUP_API_KEY"],
};
