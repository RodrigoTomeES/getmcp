import type { RegistryEntryType } from "@getmcp/core";

export const grafana: RegistryEntryType = {
  id: "grafana",
  name: "Grafana",
  description:
    "Grafana observability platform — query dashboards, manage alerts, and explore metrics data sources",
  config: {
    command: "npx",
    args: ["-y", "mcp-grafana"],
    env: {
      GRAFANA_URL: "",
      GRAFANA_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "mcp-grafana",
  runtime: "node",
  repository: "https://github.com/grafana/mcp-grafana",
  homepage: "https://grafana.com",
  author: "Grafana Labs",
  categories: ["devops", "cloud"],
  requiredEnvVars: ["GRAFANA_URL", "GRAFANA_API_KEY"],
};
