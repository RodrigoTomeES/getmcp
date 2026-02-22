import type { RegistryEntryType } from "@getmcp/core";

export const kubernetes: RegistryEntryType = {
  id: "kubernetes",
  name: "Kubernetes",
  description:
    "Kubernetes cluster management — manage pods, deployments, services, and cluster resources",
  config: {
    command: "npx",
    args: ["-y", "mcp-server-kubernetes"],
    env: {},
    transport: "stdio",
  },
  package: "mcp-server-kubernetes",
  runtime: "node",
  repository: "https://github.com/Flux159/mcp-server-kubernetes",
  homepage: "https://github.com/Flux159/mcp-server-kubernetes",
  author: "Flux159",
  categories: ["devops", "cloud"],
  requiredEnvVars: [],
};
