import type { RegistryEntryType } from "@getmcp/core";

export const discord: RegistryEntryType = {
  id: "discord",
  name: "Discord",
  description:
    "Discord bot integration — send messages, manage channels, read message history, and interact with servers",
  config: {
    command: "npx",
    args: ["-y", "mcp-discord"],
    env: {
      DISCORD_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-discord",
  runtime: "node",
  repository: "https://github.com/v-3/mcp-discord",
  homepage: "https://github.com/v-3/mcp-discord",
  author: "v-3",
  categories: ["communication"],
  requiredEnvVars: ["DISCORD_TOKEN"],
};
