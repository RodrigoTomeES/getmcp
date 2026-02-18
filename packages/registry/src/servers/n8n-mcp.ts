import type { RegistryEntryType } from "@getmcp/core";

export const n8nMcp: RegistryEntryType = {
  id: "n8n-mcp",
  name: "n8n",
  description:
    "Build, manage, and execute n8n workflows from AI assistants. Create automation workflows, manage credentials, and trigger executions",
  config: {
    command: "npx",
    args: ["-y", "n8n-mcp"],
    env: {
      N8N_API_URL: "",
      N8N_API_KEY: "",
    },
    transport: "stdio",
  },
  package: "n8n-mcp",
  runtime: "node",
  repository: "https://github.com/czlonkowski/n8n-mcp",
  homepage: "https://github.com/czlonkowski/n8n-mcp",
  author: "czlonkowski",
  categories: ["automation", "workflow"],
  requiredEnvVars: ["N8N_API_URL", "N8N_API_KEY"],
};
