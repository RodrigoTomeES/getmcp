import type { RegistryEntryType } from "@getmcp/core";

export const azure: RegistryEntryType = {
  id: "azure",
  name: "Azure",
  description:
    "Microsoft Azure integration — manage Azure resources, storage, compute, and cloud services",
  config: {
    command: "npx",
    args: ["-y", "mcp-azure"],
    env: {
      AZURE_SUBSCRIPTION_ID: "",
      AZURE_TENANT_ID: "",
    },
    transport: "stdio",
  },
  package: "mcp-azure",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-azure",
  homepage: "https://github.com/nicholasgriffintn/mcp-azure",
  author: "Nicholas Griffin",
  categories: ["cloud", "devops"],
  requiredEnvVars: ["AZURE_SUBSCRIPTION_ID", "AZURE_TENANT_ID"],
};
