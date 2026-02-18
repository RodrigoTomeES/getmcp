import type { RegistryEntryType } from "@getmcp/core";

export const mindsdb: RegistryEntryType = {
  id: "mindsdb",
  name: "MindsDB",
  description:
    "Federated AI query engine with a built-in MCP server. Connect, unify, and query across databases, data warehouses, and SaaS applications using AI",
  config: {
    url: "http://localhost:47334/mcp",
    transport: "sse",
    headers: {},
  },
  runtime: "docker",
  repository: "https://github.com/mindsdb/mindsdb",
  homepage: "https://mindsdb.com",
  author: "MindsDB",
  categories: ["data", "ai"],
  requiredEnvVars: [],
};
