#!/usr/bin/env node

/**
 * getmcp CLI entry point.
 *
 * Usage:
 *   getmcp add [server-id]         Install an MCP server (aliases: install, i)
 *   getmcp remove <server-name>    Remove an MCP server (aliases: rm, r, uninstall)
 *   getmcp list [--installed]      List available or installed servers (alias: ls)
 *   getmcp find [query]            Interactive server search (aliases: search, s, f)
 *   getmcp check                   Check for registry updates
 *   getmcp update                  Update installed servers
 *   getmcp init                    Scaffold a new server entry
 */

import { createRequire } from "node:module";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { listCommand } from "./commands/list.js";
import { findCommand } from "./commands/find.js";
import { checkCommand } from "./commands/check.js";
import { updateCommand } from "./commands/update.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { importCommand } from "./commands/import.js";
import { syncCommand } from "./commands/sync.js";
import { parseFlags, resolveAlias } from "./utils.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json") as { version: string };

function printHelp(): void {
  console.log(`
getmcp v${VERSION} — Install MCP servers into any AI application

Usage:
  getmcp add [server-id]         Install an MCP server
  getmcp remove <server-name>    Remove an MCP server from app configs
  getmcp list                    List all available MCP servers
  getmcp list --installed        List servers installed in detected apps
  getmcp list --search=<query>   Search the registry
  getmcp list --category=<cat>   Filter by category
  getmcp find [query]            Interactive fuzzy search
  getmcp check                   Check for registry updates
  getmcp update                  Update installed servers
  getmcp init                    Scaffold a new server entry
  getmcp doctor                  Run health diagnostics
  getmcp import                  Import existing servers into tracking
  getmcp sync                    Sync servers from getmcp.json manifest

Command Aliases:
  add      install, i
  remove   rm, r, uninstall
  list     ls
  find     search, s, f
  doctor   dr

Options:
  --help, -h        Show this help message
  --version, -v     Show version number
  --yes, -y         Skip confirmation prompts (use defaults)
  --app <id>        Target specific app (repeatable)
  --all-apps        Target all detected apps
  --dry-run         Preview changes without writing files
  --json            Output machine-readable JSON
  --quiet, -q       Minimal output (one item per line)
  --global, -g      Install to global config (for dual-scope apps)
  --project         Install to project config (for dual-scope apps)
  --from-npm <pkg>  Install unverified npm package as MCP server
  --from-pypi <pkg> Install unverified PyPI package as MCP server
  --from-url <url>  Install unverified remote URL as MCP server

Examples:
  getmcp add                                   # Interactive server selection
  getmcp add github                            # Install GitHub MCP server
  getmcp add github --app claude-desktop       # Install to specific app
  getmcp add github -y --all-apps              # Install to all apps, no prompts
  getmcp add github --dry-run                  # Preview what would be written
  getmcp i github -y --app vscode --app cursor # Aliases + multiple apps
  getmcp remove github                         # Remove GitHub from all apps
  getmcp rm github -y                          # Remove without confirmation
  getmcp ls --search=database                  # Find database-related servers
  getmcp find                                  # Interactive fuzzy search
  getmcp check                                 # Check for updates
  getmcp update                                # Re-apply configs from registry
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command: rawCommand, serverId, flags } = parseFlags(args);

  if (!rawCommand || flags.help) {
    printHelp();
    return;
  }

  if (flags.version) {
    console.log(VERSION);
    return;
  }

  const command = resolveAlias(rawCommand);

  if (!command) {
    console.error(`Unknown command: ${rawCommand}`);
    printHelp();
    process.exit(1);
  }

  switch (command) {
    case "add": {
      await addCommand(serverId, {
        yes: flags.yes,
        apps: flags.apps,
        allApps: flags.allApps,
        dryRun: flags.dryRun,
        json: flags.json,
        fromNpm: flags.fromNpm,
        fromPypi: flags.fromPypi,
        fromUrl: flags.fromUrl,
        global: flags.global,
        project: flags.project,
      });
      break;
    }

    case "remove": {
      await removeCommand(serverId, {
        yes: flags.yes,
        apps: flags.apps,
        dryRun: flags.dryRun,
        global: flags.global,
        project: flags.project,
      });
      break;
    }

    case "list": {
      await listCommand({
        installed: flags.installed,
        search: flags.search,
        category: flags.category,
        json: flags.json,
        quiet: flags.quiet,
      });
      break;
    }

    case "find": {
      await findCommand(serverId);
      break;
    }

    case "check": {
      await checkCommand({
        json: flags.json,
      });
      break;
    }

    case "update": {
      await updateCommand({
        yes: flags.yes,
        apps: flags.apps,
        allApps: flags.allApps,
        dryRun: flags.dryRun,
        global: flags.global,
        project: flags.project,
      });
      break;
    }

    case "init": {
      await initCommand();
      break;
    }

    case "doctor": {
      await doctorCommand({
        json: flags.json,
      });
      break;
    }

    case "import": {
      await importCommand({
        yes: flags.yes,
        json: flags.json,
      });
      break;
    }

    case "sync": {
      await syncCommand({
        yes: flags.yes,
        apps: flags.apps,
        allApps: flags.allApps,
        dryRun: flags.dryRun,
        json: flags.json,
        global: flags.global,
        project: flags.project,
      });
      break;
    }

    default:
      console.error(`Unknown command: ${rawCommand}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  // Graceful exit on Ctrl+C / prompt cancellation
  if (
    err instanceof Error &&
    (err.message.includes("User force closed") ||
      err.message.includes("prompt was canceled") ||
      err.message.includes("Operation cancelled"))
  ) {
    console.log("\nCancelled.");
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
