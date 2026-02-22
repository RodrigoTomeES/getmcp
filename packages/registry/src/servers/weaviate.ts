import type { RegistryEntryType } from "@getmcp/core";

export const weaviate: RegistryEntryType = {
  id: "weaviate",
  name: "Weaviate",
  description:
    "Weaviate vector database — manage schemas, import objects, and perform semantic vector searches",
  config: {
    command: "npx",
    args: ["-y", "mcp-weaviate"],
    env: {
      WEAVIATE_URL: "http://localhost:8080",
    },
    transport: "stdio",
  },
  package: "mcp-weaviate",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-weaviate",
  homepage: "https://weaviate.io",
  author: "Nicholas Griffin",
  categories: ["data", "ai"],
  requiredEnvVars: ["WEAVIATE_URL"],
};
