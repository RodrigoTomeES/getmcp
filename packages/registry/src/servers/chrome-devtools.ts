import type { RegistryEntryType } from "@getmcp/core";

export const chromeDevtools: RegistryEntryType = {
  id: "chrome-devtools",
  name: "Chrome DevTools",
  description:
    "Chrome DevTools for coding agents. Inspect pages, debug JavaScript, monitor network requests, analyze performance, and access the DOM",
  config: {
    command: "npx",
    args: ["-y", "chrome-devtools-mcp@latest"],
    env: {},
    transport: "stdio",
  },
  package: "chrome-devtools-mcp",
  runtime: "node",
  repository: "https://github.com/ChromeDevTools/chrome-devtools-mcp",
  homepage: "https://github.com/ChromeDevTools/chrome-devtools-mcp",
  author: "Google Chrome",
  categories: ["browser", "debugging", "developer-tools"],
  requiredEnvVars: [],
};
