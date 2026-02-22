import type { RegistryEntryType } from "@getmcp/core";

export const elasticsearch: RegistryEntryType = {
  id: "elasticsearch",
  name: "Elasticsearch",
  description:
    "Elasticsearch search and analytics — index, search, and manage documents in Elasticsearch clusters",
  config: {
    command: "npx",
    args: ["-y", "mcp-server-elasticsearch"],
    env: {
      ELASTICSEARCH_URL: "http://localhost:9200",
    },
    transport: "stdio",
  },
  package: "mcp-server-elasticsearch",
  runtime: "node",
  repository: "https://github.com/cr7258/elasticsearch-mcp-server",
  homepage: "https://github.com/cr7258/elasticsearch-mcp-server",
  author: "cr7258",
  categories: ["data", "search"],
  requiredEnvVars: ["ELASTICSEARCH_URL"],
};
