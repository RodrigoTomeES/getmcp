import type { RegistryEntryType } from "@getmcp/core";

export const datadog: RegistryEntryType = {
  id: "datadog",
  name: "Datadog",
  description:
    "Datadog monitoring platform — query metrics, manage monitors, view dashboards, and analyze logs",
  config: {
    command: "npx",
    args: ["-y", "@datadog/datadog-mcp-server"],
    env: {
      DD_API_KEY: "",
      DD_APP_KEY: "",
    },
    transport: "stdio",
  },
  package: "@datadog/datadog-mcp-server",
  runtime: "node",
  repository: "https://github.com/DataDog/datadog-mcp-server",
  homepage: "https://www.datadoghq.com",
  author: "Datadog",
  categories: ["devops", "cloud"],
  requiredEnvVars: ["DD_API_KEY", "DD_APP_KEY"],
};
