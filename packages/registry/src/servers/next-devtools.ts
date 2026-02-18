import type { RegistryEntryType } from "@getmcp/core";

export const nextDevtools: RegistryEntryType = {
  id: "next-devtools",
  name: "Next.js DevTools MCP",
  description:
    "Access Next.js application internals in real-time. Retrieve build/runtime/type errors, development logs, page metadata, server actions, and project structure. Includes Next.js knowledge base and migration tools. Requires Next.js 16+",
  config: {
    command: "npx",
    args: ["-y", "next-devtools-mcp@latest"],
    env: {},
    transport: "stdio",
  },
  package: "next-devtools-mcp",
  runtime: "node",
  repository: "https://github.com/vercel/next-devtools-mcp",
  homepage: "https://nextjs.org/docs/app/guides/mcp",
  author: "Vercel",
  categories: ["developer-tools", "web-development", "nextjs", "debugging"],
  requiredEnvVars: [],
};
