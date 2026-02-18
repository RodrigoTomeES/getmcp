import type { RegistryEntryType } from "@getmcp/core";

export const genaiToolbox: RegistryEntryType = {
  id: "genai-toolbox",
  name: "MCP Toolbox for Databases",
  description:
    "Google's open source MCP server for databases. Handles connection pooling, authentication, and observability. Query databases using AI-defined tools configured via YAML",
  config: {
    url: "http://127.0.0.1:5000",
    transport: "http",
    headers: {},
  },
  package: "@toolbox-sdk/server",
  runtime: "node",
  repository: "https://github.com/googleapis/genai-toolbox",
  homepage: "https://github.com/googleapis/genai-toolbox",
  author: "Google",
  categories: ["data", "developer-tools", "cloud"],
  requiredEnvVars: [],
};
