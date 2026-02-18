import type { RegistryEntryType } from "@getmcp/core";

export const xiaohongshuMcp: RegistryEntryType = {
  id: "xiaohongshu-mcp",
  name: "Xiaohongshu",
  description:
    "MCP server for Xiaohongshu (Little Red Book). Automate publishing, searching, commenting, and browsing content on xiaohongshu.com via browser automation",
  config: {
    url: "http://localhost:18060/mcp",
    transport: "streamable-http",
    headers: {},
  },
  runtime: "docker",
  repository: "https://github.com/xpzouying/xiaohongshu-mcp",
  homepage: "https://github.com/xpzouying/xiaohongshu-mcp",
  author: "xpzouying",
  categories: ["social-media", "automation"],
  requiredEnvVars: [],
};
