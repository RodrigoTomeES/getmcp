import type { RegistryEntryType } from "@getmcp/core";

export const trendradar: RegistryEntryType = {
  id: "trendradar",
  name: "TrendRadar",
  description:
    "AI-driven public opinion and trend monitoring with multi-platform aggregation, RSS support, and smart alerts. Analyze trends, sentiment, and news via MCP",
  config: {
    url: "http://localhost:3333/mcp",
    transport: "http",
    headers: {},
  },
  runtime: "docker",
  repository: "https://github.com/sansan0/TrendRadar",
  homepage: "https://github.com/sansan0/TrendRadar",
  author: "sansan0",
  categories: ["data", "devops"],
  requiredEnvVars: [],
};
