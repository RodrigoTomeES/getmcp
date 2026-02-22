import type { RegistryEntryType } from "@getmcp/core";

export const neo4j: RegistryEntryType = {
  id: "neo4j",
  name: "Neo4j",
  description:
    "Neo4j graph database — run Cypher queries, manage nodes and relationships in graph databases",
  config: {
    command: "npx",
    args: ["-y", "mcp-neo4j"],
    env: {
      NEO4J_URI: "bolt://localhost:7687",
      NEO4J_USER: "neo4j",
      NEO4J_PASSWORD: "",
    },
    transport: "stdio",
  },
  package: "mcp-neo4j",
  runtime: "node",
  repository: "https://github.com/neo4j-contrib/mcp-neo4j",
  homepage: "https://neo4j.com",
  author: "Neo4j",
  categories: ["data"],
  requiredEnvVars: ["NEO4J_PASSWORD"],
};
