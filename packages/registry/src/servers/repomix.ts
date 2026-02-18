import type { RegistryEntryType } from "@getmcp/core";

export const repomix: RegistryEntryType = {
  id: "repomix",
  name: "Repomix",
  description:
    "Pack entire repositories into a single AI-friendly file. Analyze codebases, generate repository summaries, and provide context for AI coding assistants",
  config: {
    command: "npx",
    args: ["-y", "repomix", "--mcp"],
    env: {},
    transport: "stdio",
  },
  package: "repomix",
  runtime: "node",
  repository: "https://github.com/yamadashy/repomix",
  homepage: "https://repomix.com",
  author: "yamadashy",
  categories: ["developer-tools", "code-analysis"],
  requiredEnvVars: [],
};
