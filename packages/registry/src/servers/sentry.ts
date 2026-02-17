import type { RegistryEntryType } from "@mcp-hub/core";

export const sentry: RegistryEntryType = {
  id: "sentry",
  name: "Sentry",
  description:
    "Interact with Sentry for error tracking, issue management, and performance monitoring",
  config: {
    url: "https://mcp.sentry.dev/sse",
    transport: "sse",
    headers: {},
  },
  runtime: "node",
  repository: "https://github.com/getsentry/sentry-mcp",
  homepage: "https://mcp.sentry.dev",
  author: "Sentry",
  categories: ["monitoring", "error-tracking", "developer-tools"],
  requiredEnvVars: [],
};
