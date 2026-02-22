import type { RegistryEntryType } from "@getmcp/core";

export const obsidian: RegistryEntryType = {
  id: "obsidian",
  name: "Obsidian",
  description:
    "Obsidian note-taking integration — search, read, create, and edit notes in Obsidian vaults",
  config: {
    command: "npx",
    args: ["-y", "obsidian-mcp"],
    env: {
      OBSIDIAN_VAULT_PATH: "",
    },
    transport: "stdio",
  },
  package: "obsidian-mcp",
  runtime: "node",
  repository: "https://github.com/smithery-ai/mcp-obsidian",
  homepage: "https://github.com/smithery-ai/mcp-obsidian",
  author: "Smithery",
  categories: ["documentation", "utilities"],
  requiredEnvVars: ["OBSIDIAN_VAULT_PATH"],
};
