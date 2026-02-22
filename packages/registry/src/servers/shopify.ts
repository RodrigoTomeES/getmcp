import type { RegistryEntryType } from "@getmcp/core";

export const shopify: RegistryEntryType = {
  id: "shopify",
  name: "Shopify",
  description:
    "Shopify e-commerce platform — manage products, orders, customers, and store configuration",
  config: {
    command: "npx",
    args: ["-y", "@shopify/dev-mcp@latest"],
    env: {},
    transport: "stdio",
  },
  package: "@shopify/dev-mcp",
  runtime: "node",
  repository: "https://github.com/Shopify/dev-mcp",
  homepage: "https://shopify.dev",
  author: "Shopify",
  categories: ["web", "automation"],
  requiredEnvVars: [],
};
