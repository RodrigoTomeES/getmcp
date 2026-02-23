import type { RegistryEntryType } from "@getmcp/core";

export const okmira: RegistryEntryType = {
  id: "okmira",
  name: "Okmira",
  description:
    "Connect AI coding assistants to stakeholder feedback, skills, and specialized agents through the Mira platform",
  config: {
    command: "npx",
    args: ["-y", "@okmira/mcp"],
    env: {
      CC_FEEDBACK_API_URL: "https://okmira.ai",
      CC_FEEDBACK_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "@okmira/mcp",
  runtime: "node",
  homepage: "https://okmira.ai",
  author: "Okmira",
  categories: ["developer-tools", "communication"],
  requiredEnvVars: ["CC_FEEDBACK_API_URL", "CC_FEEDBACK_API_KEY"],
};
