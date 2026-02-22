import type { RegistryEntryType } from "@getmcp/core";

export const terraform: RegistryEntryType = {
  id: "terraform",
  name: "Terraform",
  description:
    "Terraform infrastructure-as-code — plan, apply, and manage Terraform configurations and state",
  config: {
    command: "npx",
    args: ["-y", "mcp-terraform"],
    env: {},
    transport: "stdio",
  },
  package: "mcp-terraform",
  runtime: "node",
  repository: "https://github.com/hashicorp/terraform-mcp-server",
  homepage: "https://www.terraform.io",
  author: "HashiCorp",
  categories: ["devops", "cloud"],
  requiredEnvVars: [],
};
