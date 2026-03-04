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
 *   getmcp doctor                  Run health diagnostics (alias: dr)
 *   getmcp import                  Import existing servers into tracking
 *   getmcp sync                    Sync servers from getmcp.json manifest
 *   getmcp registry <sub> [args]   Manage registry sources (aliases: reg)
 */

import { createRequire } from "node:module";
import * as p from "@clack/prompts";
import { exitIfCancelled, isPromptCancellation, parseFlags, resolveAlias } from "./utils.js";
import { initRegistryCache, refreshRegistryCache } from "./registry-cache.js";

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
  getmcp doctor                  Run health diagnostics
  getmcp import                  Import existing servers into tracking
  getmcp sync                    Sync servers from getmcp.json manifest
  getmcp registry add <url>      Add a registry source
  getmcp registry remove <name>  Remove a registry source
  getmcp registry list           List configured registries
  getmcp registry login <name>   Authenticate to a private registry
  getmcp registry logout <name>  Remove stored credentials

Command Aliases:
  add      install, i
  remove   rm, r, uninstall
  list     ls
  find     search, s, f
  doctor   dr
  registry reg

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
  --refresh         Force-refresh the registry cache (prompts for incremental or full)
  --registry <name> Target a specific registry (for add)
  --name <name>     Name for a registry (for registry add)
  --type <type>     Registry type: public or private (for registry add)
  --method <m>      Auth method: bearer, basic, or header (for registry login)

Examples:
  getmcp add                                                  # Interactive server selection
  getmcp add io.github.github/github-mcp-server               # Install by official ID
  getmcp add github                                           # Fuzzy search for "github"
  getmcp add io.github.github/github-mcp-server --app claude-desktop  # Install to specific app
  getmcp add io.github.github/github-mcp-server -y --all-apps # Install to all apps, no prompts
  getmcp add io.github.github/github-mcp-server --dry-run     # Preview what would be written
  getmcp remove github                                        # Remove from all apps
  getmcp ls --search=database                                 # Find database-related servers
  getmcp find                                                 # Interactive fuzzy search
  getmcp check                                                # Check for updates
  getmcp update                                               # Re-apply configs from registry
`);
}

/**
 * Extract subcommand and positional args for `getmcp registry <sub> [args...]`.
 *
 * Given the raw argv slice, skips the first token (which is "registry" or its
 * alias) and any flags, returning the subcommand and remaining positional args.
 */
function extractRegistryArgs(argv: string[]): {
  subcommand: string | undefined;
  positional: string[];
} {
  const positional: string[] = [];

  // Skip flags (already parsed by parseFlags) and collect positional args
  // The first positional arg after "registry" is the subcommand
  let foundCommand = false;
  for (const arg of argv) {
    if (arg.startsWith("-")) continue; // skip flags
    if (!foundCommand) {
      foundCommand = true;
      continue; // skip "registry" / "reg" itself
    }
    positional.push(arg);
  }

  return {
    subcommand: positional[0],
    positional: positional.slice(1),
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command: rawCommand, serverId, flags } = parseFlags(args);

  if (!rawCommand && !flags.refresh) {
    if (flags.help || flags.version) {
      if (flags.version) console.log(VERSION);
      else printHelp();
      return;
    }
    printHelp();
    return;
  }

  if (flags.help) {
    printHelp();
    return;
  }

  if (flags.version) {
    console.log(VERSION);
    return;
  }

  // Refresh or initialise registry cache before command dispatch
  if (flags.refresh) {
    let mode: "incremental" | "full" = "incremental";
    if (!flags.yes) {
      const selected = await p.select({
        message: "How would you like to refresh the registry cache?",
        options: [
          {
            value: "incremental",
            label: "Incremental",
            hint: "fetch only updates since last sync",
          },
          { value: "full", label: "Full", hint: "clear cache and re-fetch everything" },
        ],
      });
      exitIfCancelled(selected);
      mode = selected as "incremental" | "full";
    }
    const ok = await refreshRegistryCache(mode);
    const label = mode === "full" ? "fully refreshed" : "updated";
    console.log(
      ok
        ? `Registry cache ${label}.`
        : "Registry cache refresh failed (using cached or bundled data).",
    );
    if (!rawCommand) return;
  } else {
    await initRegistryCache();
  }

  const command = resolveAlias(rawCommand!);

  if (!command) {
    console.error(`Unknown command: ${rawCommand}`);
    printHelp();
    process.exit(1);
  }

  switch (command) {
    case "add": {
      const { addCommand } = await import("./commands/add.js");
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
        registry: flags.registry,
      });
      break;
    }

    case "remove": {
      const { removeCommand } = await import("./commands/remove.js");
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
      const { listCommand } = await import("./commands/list.js");
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
      const { findCommand } = await import("./commands/find.js");
      await findCommand(serverId, {
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

    case "check": {
      const { checkCommand } = await import("./commands/check.js");
      await checkCommand({
        json: flags.json,
      });
      break;
    }

    case "update": {
      const { updateCommand } = await import("./commands/update.js");
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

    case "doctor": {
      const { doctorCommand } = await import("./commands/doctor.js");
      await doctorCommand({
        json: flags.json,
      });
      break;
    }

    case "import": {
      const { importCommand } = await import("./commands/import.js");
      await importCommand({
        yes: flags.yes,
        json: flags.json,
      });
      break;
    }

    case "sync": {
      const { syncCommand } = await import("./commands/sync.js");
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

    case "registry": {
      const { registryCommand } = await import("./commands/registry.js");
      // Extract subcommand and positional args from remaining args
      const registryArgs = extractRegistryArgs(args);
      await registryCommand(registryArgs.subcommand, registryArgs.positional, {
        json: flags.json,
        name: flags.name,
        type: flags.type,
        method: flags.method,
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
  if (isPromptCancellation(err)) {
    console.log("\nCancelled.");
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
