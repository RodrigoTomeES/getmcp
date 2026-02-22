import type { RegistryEntryType } from "@getmcp/core";

export const todoist: RegistryEntryType = {
  id: "todoist",
  name: "Todoist",
  description:
    "Todoist task management — create, update, complete, and organize tasks and projects",
  config: {
    command: "npx",
    args: ["-y", "@abhiz123/todoist-mcp-server"],
    env: {
      TODOIST_API_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "@abhiz123/todoist-mcp-server",
  runtime: "node",
  repository: "https://github.com/abhiz123/todoist-mcp-server",
  homepage: "https://github.com/abhiz123/todoist-mcp-server",
  author: "Abhishek",
  categories: ["automation", "utilities"],
  requiredEnvVars: ["TODOIST_API_TOKEN"],
};
