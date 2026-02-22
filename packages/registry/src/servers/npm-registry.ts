import type { RegistryEntryType } from "@getmcp/core";

export const npmRegistry: RegistryEntryType = {
  id: "npm-registry",
  name: "npm Registry",
  description:
    "npm package registry — search packages, view metadata, check versions, and explore dependencies",
  config: {
    command: "npx",
    args: ["-y", "mcp-npm"],
    env: {},
    transport: "stdio",
  },
  package: "mcp-npm",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-npm",
  homepage: "https://www.npmjs.com",
  author: "Nicholas Griffin",
  categories: ["developer-tools", "search"],
  requiredEnvVars: [],
};
