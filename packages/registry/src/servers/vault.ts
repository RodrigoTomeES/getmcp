import type { RegistryEntryType } from "@getmcp/core";

export const vault: RegistryEntryType = {
  id: "vault",
  name: "HashiCorp Vault",
  description: "HashiCorp Vault secrets management — read, write, and manage secrets in Vault",
  config: {
    command: "npx",
    args: ["-y", "mcp-vault"],
    env: {
      VAULT_ADDR: "http://127.0.0.1:8200",
      VAULT_TOKEN: "",
    },
    transport: "stdio",
  },
  package: "mcp-vault",
  runtime: "node",
  repository: "https://github.com/nicholasgriffintn/mcp-vault",
  homepage: "https://www.vaultproject.io",
  author: "Nicholas Griffin",
  categories: ["security", "devops"],
  requiredEnvVars: ["VAULT_TOKEN"],
};
