import type { RegistryEntryType } from "@getmcp/core";

export const vercel: RegistryEntryType = {
  id: "vercel",
  name: "Vercel",
  description:
    "Vercel platform management — manage deployments, projects, domains, and environment variables",
  config: {
    command: "npx",
    args: ["-y", "@vercel/mcp@latest"],
    env: {
      VERCEL_API_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "@vercel/mcp",
  runtime: "node",
  repository: "https://github.com/vercel/mcp",
  homepage: "https://vercel.com",
  author: "Vercel",
  categories: ["cloud", "devops"],
  requiredEnvVars: ["VERCEL_API_TOKEN"],
};
