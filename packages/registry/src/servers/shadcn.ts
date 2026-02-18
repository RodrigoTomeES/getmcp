import type { RegistryEntryType } from "@getmcp/core";

export const shadcn: RegistryEntryType = {
  id: "shadcn",
  name: "shadcn/ui",
  description:
    "Browse, search, and install components from shadcn registries. Supports multiple registries, namespaced components, and natural language component installation.",
  config: {
    command: "npx",
    args: ["shadcn@latest", "mcp"],
    env: {},
    transport: "stdio",
  },
  package: "shadcn",
  runtime: "node",
  repository: "https://github.com/shadcn-ui/ui",
  homepage: "https://ui.shadcn.com/docs/mcp",
  author: "shadcn",
  categories: ["developer-tools", "design", "web"],
  requiredEnvVars: [],
};
