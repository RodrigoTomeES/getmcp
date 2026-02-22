import type { RegistryEntryType } from "@getmcp/core";

export const stripe: RegistryEntryType = {
  id: "stripe",
  name: "Stripe",
  description:
    "Stripe payment platform — manage customers, payments, subscriptions, invoices, and products",
  config: {
    command: "npx",
    args: ["-y", "@stripe/mcp", "--tools=all", "--api-key=STRIPE_API_KEY"],
    env: {
      STRIPE_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "@stripe/mcp",
  runtime: "node",
  repository: "https://github.com/stripe/agent-toolkit",
  homepage: "https://stripe.com",
  author: "Stripe",
  categories: ["web", "automation"],
  requiredEnvVars: ["STRIPE_API_KEY"],
};
