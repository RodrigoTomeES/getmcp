import type { RegistryEntryType } from "@getmcp/core";

export const tavily: RegistryEntryType = {
  id: "tavily",
  name: "Tavily",
  description:
    "AI-optimized web search — search the web and extract content optimized for LLM consumption",
  config: {
    command: "npx",
    args: ["-y", "tavily-mcp@latest"],
    env: {
      TAVILY_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "tavily-mcp",
  runtime: "node",
  repository: "https://github.com/tavily-ai/tavily-mcp",
  homepage: "https://tavily.com",
  author: "Tavily",
  categories: ["search", "ai"],
  requiredEnvVars: ["TAVILY_API_KEY"],
};
