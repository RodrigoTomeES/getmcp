#!/usr/bin/env node

/**
 * mcp-hub CLI entry point.
 *
 * Usage:
 *   mcp-hub add [server-id]       Install an MCP server
 *   mcp-hub remove <server-name>  Remove an MCP server
 *   mcp-hub list [--installed]    List available or installed servers
 *   mcp-hub list [--search=query] Search the registry
 *   mcp-hub list [--category=cat] Filter by category
 */

import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { listCommand } from "./commands/list.js";

const VERSION = "0.1.0";

function printHelp(): void {
  console.log(`
mcp-hub v${VERSION} — Install MCP servers into any AI application

Usage:
  mcp-hub add [server-id]         Install an MCP server interactively
  mcp-hub remove <server-name>    Remove an MCP server from app configs
  mcp-hub list                    List all available MCP servers
  mcp-hub list --installed        List servers installed in detected apps
  mcp-hub list --search=<query>   Search the registry
  mcp-hub list --category=<cat>   Filter by category

Options:
  --help, -h     Show this help message
  --version, -v  Show version number

Examples:
  mcp-hub add                     # Interactive server selection
  mcp-hub add github              # Install GitHub MCP server
  mcp-hub remove github           # Remove GitHub from all apps
  mcp-hub list --search=database  # Find database-related servers
  mcp-hub list --installed        # See what's configured in your apps
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(VERSION);
    return;
  }

  const command = args[0];

  switch (command) {
    case "add": {
      const serverId = args[1];
      await addCommand(serverId);
      break;
    }

    case "remove": {
      const serverName = args[1];
      await removeCommand(serverName);
      break;
    }

    case "list": {
      const installed = args.includes("--installed");
      const searchArg = args.find((a) => a.startsWith("--search="));
      const categoryArg = args.find((a) => a.startsWith("--category="));

      await listCommand({
        installed,
        search: searchArg?.split("=")[1],
        category: categoryArg?.split("=")[1],
      });
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  // Graceful exit on Ctrl+C / prompt cancellation
  if (
    err instanceof Error &&
    (err.message.includes("User force closed") ||
      err.message.includes("prompt was canceled"))
  ) {
    console.log("\nCancelled.");
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
