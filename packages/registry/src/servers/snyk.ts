import type { RegistryEntryType } from "@getmcp/core";

export const snyk: RegistryEntryType = {
  id: "snyk",
  name: "Snyk",
  description:
    "Snyk security scanning — find and fix vulnerabilities in code, dependencies, and container images",
  config: {
    command: "npx",
    args: ["-y", "mcp-snyk"],
    env: {
      SNYK_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-snyk",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-snyk",
  homepage: "https://snyk.io",
  author: "Nicholas Griffin",
  categories: ["security", "developer-tools"],
  requiredEnvVars: ["SNYK_TOKEN"],
};
