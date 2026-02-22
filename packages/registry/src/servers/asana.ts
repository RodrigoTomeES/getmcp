import type { RegistryEntryType } from "@getmcp/core";

export const asana: RegistryEntryType = {
  id: "asana",
  name: "Asana",
  description:
    "Asana project management — create, update, and track tasks, projects, and workspaces",
  config: {
    command: "npx",
    args: ["-y", "asana-mcp-server"],
    env: {
      ASANA_ACCESS_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "asana-mcp-server",
  runtime: "node",
  repository: "https://github.com/roychri/mcp-server-asana",
  homepage: "https://github.com/roychri/mcp-server-asana",
  author: "roychri",
  categories: ["developer-tools", "automation"],
  requiredEnvVars: ["ASANA_ACCESS_TOKEN"],
};
