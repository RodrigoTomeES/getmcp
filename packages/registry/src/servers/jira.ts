import type { RegistryEntryType } from "@getmcp/core";

export const jira: RegistryEntryType = {
  id: "jira",
  name: "Jira",
  description:
    "Atlassian Jira integration — search, create, and update issues, manage sprints and boards",
  config: {
    command: "npx",
    args: [
      "-y",
      "mcp-atlassian",
      "--jira-url",
      "https://your-domain.atlassian.net",
      "--jira-email",
      "your-email@example.com",
    ],
    env: {
      JIRA_API_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-atlassian",
  runtime: "node",
  repository: "https://github.com/sooperset/mcp-atlassian",
  homepage: "https://github.com/sooperset/mcp-atlassian",
  author: "sooperset",
  categories: ["developer-tools", "automation"],
  requiredEnvVars: ["JIRA_API_TOKEN"],
};
