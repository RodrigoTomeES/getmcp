import type { RegistryEntryType } from "@getmcp/core";

export const swagger: RegistryEntryType = {
  id: "swagger",
  name: "Swagger/OpenAPI",
  description:
    "OpenAPI specification tools — parse, validate, and explore API definitions from Swagger/OpenAPI specs",
  config: {
    command: "npx",
    args: ["-y", "mcp-swagger"],
    env: {},
    transport: "stdio",
  },
  package: "mcp-swagger",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-swagger",
  homepage: "https://swagger.io",
  author: "Nicholas Griffin",
  categories: ["documentation", "developer-tools"],
  requiredEnvVars: [],
};
