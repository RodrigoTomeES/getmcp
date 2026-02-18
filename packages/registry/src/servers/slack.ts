import type { RegistryEntryType } from "@getmcp/core";

export const slack: RegistryEntryType = {
  id: "slack",
  name: "Slack",
  description:
    "Channel management and messaging capabilities for Slack workspaces",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env: {
      SLACK_BOT_TOKEN: "",
      SLACK_TEAM_ID: "",
    },
    transport: "stdio",
  },
  package: "@modelcontextprotocol/server-slack",
  runtime: "node",
  repository: "https://github.com/modelcontextprotocol/servers",
  homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
  author: "Anthropic",
  categories: ["communication"],
  requiredEnvVars: ["SLACK_BOT_TOKEN", "SLACK_TEAM_ID"],
};
