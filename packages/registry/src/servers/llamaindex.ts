import type { RegistryEntryType } from "@getmcp/core";

export const llamaindex: RegistryEntryType = {
  id: "llamaindex",
  name: "LlamaIndex",
  description:
    "LlamaIndex data framework — build and query indexes over documents for RAG applications",
  config: {
    command: "npx",
    args: ["-y", "mcp-llamaindex"],
    env: {},
    transport: "stdio",
  },
  package: "mcp-llamaindex",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-llamaindex",
  homepage: "https://www.llamaindex.ai",
  author: "Nicholas Griffin",
  categories: ["ai", "data"],
  requiredEnvVars: [],
};
