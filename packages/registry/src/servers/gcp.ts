import type { RegistryEntryType } from "@getmcp/core";

export const gcp: RegistryEntryType = {
  id: "gcp",
  name: "Google Cloud",
  description:
    "Google Cloud Platform integration — manage GCP resources, Cloud Storage, BigQuery, and more",
  config: {
    command: "npx",
    args: ["-y", "mcp-server-gcp"],
    env: {
      GOOGLE_APPLICATION_CREDENTIALS: "",
    },
    transport: "stdio",
  },
  package: "mcp-server-gcp",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-server-gcp",
  homepage: "https://github.com/nicholasgriffintn/mcp-server-gcp",
  author: "Nicholas Griffin",
  categories: ["cloud", "devops"],
  requiredEnvVars: ["GOOGLE_APPLICATION_CREDENTIALS"],
};
