import type { RegistryEntryType } from "@getmcp/core";

export const dynamodb: RegistryEntryType = {
  id: "dynamodb",
  name: "DynamoDB",
  description:
    "AWS DynamoDB NoSQL database — scan, query, get, put, update, and delete items in DynamoDB tables",
  config: {
    command: "npx",
    args: ["-y", "mcp-dynamodb"],
    env: {
      AWS_ACCESS_KEY_ID: "",
      AWS_SECRET_ACCESS_KEY: "",
      AWS_REGION: "us-east-1",
    },
    transport: "stdio",
  },
  package: "mcp-dynamodb",
  runtime: "node",
  repository: "https://github.com/benkibbey/mcp-dynamodb",
  homepage: "https://github.com/benkibbey/mcp-dynamodb",
  author: "benkibbey",
  categories: ["data", "cloud"],
  requiredEnvVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
};
