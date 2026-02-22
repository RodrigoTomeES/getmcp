import type { RegistryEntryType } from "@getmcp/core";

export const telegram: RegistryEntryType = {
  id: "telegram",
  name: "Telegram",
  description:
    "Telegram bot integration — send messages, manage chats, and interact with the Telegram Bot API",
  config: {
    command: "npx",
    args: ["-y", "mcp-telegram"],
    env: {
      TELEGRAM_BOT_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-telegram",
  runtime: "node",
  repository: "https://github.com/niceperson-dev/mcp-telegram",
  homepage: "https://github.com/niceperson-dev/mcp-telegram",
  author: "niceperson-dev",
  categories: ["communication"],
  requiredEnvVars: ["TELEGRAM_BOT_TOKEN"],
};
