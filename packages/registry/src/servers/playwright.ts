import type { RegistryEntryType } from "@getmcp/core";

export const playwright: RegistryEntryType = {
  id: "playwright",
  name: "Playwright",
  description:
    "Browser automation using Playwright. Navigate pages, take screenshots, interact with elements, execute JavaScript, and generate PDFs",
  config: {
    command: "npx",
    args: ["-y", "@playwright/mcp@latest"],
    env: {},
    transport: "stdio",
  },
  package: "@playwright/mcp",
  runtime: "node",
  repository: "https://github.com/microsoft/playwright-mcp",
  homepage: "https://github.com/microsoft/playwright-mcp",
  author: "Microsoft",
  categories: ["web", "automation", "developer-tools"],
  requiredEnvVars: [],
};
