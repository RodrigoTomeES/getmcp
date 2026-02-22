import type { RegistryEntryType } from "@getmcp/core";

export const notion: RegistryEntryType = {
  id: "notion",
  name: "Notion",
  description:
    "Notion workspace integration — search, read, create, and update pages, databases, and blocks",
  config: {
    command: "npx",
    args: ["-y", "@notionhq/notion-mcp-server"],
    env: {
      OPENAPI_MCP_HEADERS: "",
    },
    transport: "stdio",
  },
  package: "@notionhq/notion-mcp-server",
  runtime: "node",
  repository: "https://github.com/makenotion/notion-mcp-server",
  homepage: "https://developers.notion.com",
  author: "Notion",
  categories: ["developer-tools", "documentation"],
  requiredEnvVars: ["OPENAPI_MCP_HEADERS"],
};
