/**
 * `getmcp find` command.
 *
 * Interactive fuzzy search through the registry.
 * After selection, jumps directly into the add flow.
 *
 * Aliases: find, search, s, f
 */

import * as p from "@clack/prompts";
import { getAllServers, searchServers } from "@getmcp/registry";
import type { RegistryEntryType } from "@getmcp/core";
import { addCommand } from "./add.js";

export async function findCommand(initialQuery?: string): Promise<void> {
  p.intro("getmcp find");

  const servers = getAllServers();

  if (servers.length === 0) {
    p.log.warn("No servers in registry.");
    p.outro("Done");
    return;
  }

  // If a query was provided as argument, search and show results
  let filteredServers: RegistryEntryType[];

  if (initialQuery) {
    filteredServers = searchServers(initialQuery);
    if (filteredServers.length === 0) {
      p.log.warn(`No servers matching "${initialQuery}".`);

      // Offer to search again
      const newQuery = await p.text({
        message: "Try a different search term:",
        placeholder: "e.g., database, github, docker",
      });

      if (p.isCancel(newQuery)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      filteredServers = searchServers(newQuery);
      if (filteredServers.length === 0) {
        p.log.warn(`No servers matching "${newQuery}".`);
        p.outro("Done");
        return;
      }
    }
  } else {
    // No query — prompt for search term or show all
    const query = await p.text({
      message: "Search for an MCP server:",
      placeholder: "e.g., database, github, docker (leave empty to show all)",
    });

    if (p.isCancel(query)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    filteredServers = query.trim() ? searchServers(query) : servers;

    if (filteredServers.length === 0) {
      p.log.warn(`No servers matching "${query}".`);
      p.outro("Done");
      return;
    }
  }

  // Show results and let user pick
  const selected = await p.select({
    message: `Found ${filteredServers.length} server(s). Select one to install:`,
    options: filteredServers.map((s) => {
      const transport = "command" in s.config ? "stdio" : "remote";
      const envCount = s.requiredEnvVars.length;
      const envNote = envCount > 0 ? ` | ${envCount} env var${envCount > 1 ? "s" : ""}` : "";
      const categories =
        s.categories && s.categories.length > 0 ? ` | ${s.categories.join(", ")}` : "";

      return {
        label: s.name,
        hint: `${transport}${envNote}${categories}`,
        value: s,
      };
    }),
  });

  if (p.isCancel(selected)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  p.outro(`Selected: ${selected.name}`);

  // Jump into add flow
  await addCommand(selected.id);
}
