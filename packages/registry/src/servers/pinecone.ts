import type { RegistryEntryType } from "@getmcp/core";

export const pinecone: RegistryEntryType = {
  id: "pinecone",
  name: "Pinecone",
  description:
    "Pinecone vector database — manage indexes, upsert and query vector embeddings for similarity search",
  config: {
    command: "npx",
    args: ["-y", "mcp-pinecone"],
    env: {
      PINECONE_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "mcp-pinecone",
  runtime: "node",
  repository: "https://github.com/pinecone-io/pinecone-mcp",
  homepage: "https://www.pinecone.io",
  author: "Pinecone",
  categories: ["data", "ai"],
  requiredEnvVars: ["PINECONE_API_KEY"],
};
