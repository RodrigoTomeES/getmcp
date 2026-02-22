import type { RegistryEntryType } from "@getmcp/core";

export const twilio: RegistryEntryType = {
  id: "twilio",
  name: "Twilio",
  description:
    "Twilio communications platform — send SMS, make calls, and manage communication services",
  config: {
    command: "npx",
    args: ["-y", "mcp-twilio"],
    env: {
      TWILIO_ACCOUNT_SID: "",
      TWILIO_AUTH_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-twilio",
  runtime: "node",
  repository: "https://github.com/twilio/mcp-twilio",
  homepage: "https://www.twilio.com",
  author: "Twilio",
  categories: ["communication", "automation"],
  requiredEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
};
