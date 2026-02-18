import type { RegistryEntryType } from "@getmcp/core";

export const unityMcp: RegistryEntryType = {
  id: "unity-mcp",
  name: "Unity",
  description:
    "Bridge AI assistants with the Unity Editor. Manage assets, control scenes, edit scripts, and automate game development tasks within Unity",
  config: {
    url: "http://localhost:8080/mcp",
    transport: "http",
    headers: {},
  },
  runtime: "python",
  repository: "https://github.com/CoplayDev/unity-mcp",
  homepage: "https://github.com/CoplayDev/unity-mcp",
  author: "Coplay",
  categories: ["game-development", "developer-tools"],
  requiredEnvVars: [],
};
