import type { RegistryEntryType } from "@mcp-hub/core";

export const fetch: RegistryEntryType = {
  id: "fetch",
  name: "Fetch",
  description:
    "Fetch web content and convert HTML to markdown. Useful for reading web pages, APIs, and documentation",
  config: {
    command: "uvx",
    args: ["mcp-server-fetch"],
    env: {},
    transport: "stdio",
  },
  package: "mcp-server-fetch",
  runtime: "python",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
  author: "Anthropic",
  categories: ["web", "utilities"],
  requiredEnvVars: [],
};
