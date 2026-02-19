/**
 * `getmcp add` command.
 *
 * Workflow:
 * 1. User picks a server from the registry (or provides ID as argument)
 * 2. If server has required env vars, prompt for them
 * 3. Detect installed AI apps
 * 4. User selects which apps to configure
 * 5. Generate config for each selected app
 * 6. Merge into existing config files (never overwrite)
 */

import { select, checkbox, input, Separator } from "@inquirer/prompts";
import {
  getAllServers,
  getServer,
  searchServers,
} from "@getmcp/registry";
import { getGenerator } from "@getmcp/generators";
import { isStdioConfig } from "@getmcp/core";
import type { LooseServerConfigType, RegistryEntryType } from "@getmcp/core";
import { detectApps, type DetectedApp } from "../detect.js";
import { mergeServerIntoConfig, writeConfigFile } from "../config-file.js";
import { getSavedSelectedApps, saveSelectedApps } from "../preferences.js";

export async function addCommand(serverIdArg?: string): Promise<void> {
  // Step 1: Select server
  let entry: RegistryEntryType;

  if (serverIdArg) {
    const found = getServer(serverIdArg);
    if (!found) {
      // Try fuzzy search
      const matches = searchServers(serverIdArg);
      if (matches.length === 0) {
        console.error(`Server "${serverIdArg}" not found in registry.`);
        process.exit(1);
      }
      if (matches.length === 1) {
        entry = matches[0];
      } else {
        entry = await select({
          message: `Multiple matches for "${serverIdArg}". Pick one:`,
          choices: matches.map((s) => ({
            name: `${s.name} — ${s.description}`,
            value: s,
          })),
        });
      }
    } else {
      entry = found;
    }
  } else {
    const servers = getAllServers();
    entry = await select({
      message: "Select an MCP server to install:",
      choices: servers.map((s) => ({
        name: `${s.name} — ${s.description}`,
        value: s,
      })),
    });
  }

  console.log(`\nInstalling: ${entry.name}`);
  console.log(`  ${entry.description}\n`);

  // Step 2: Prompt for required environment variables
  const config = structuredClone(entry.config) as LooseServerConfigType;

  if (entry.requiredEnvVars.length > 0 && isStdioConfig(config)) {
    console.log("This server requires environment variables:\n");
    for (const envVar of entry.requiredEnvVars) {
      const value = await input({
        message: `  ${envVar}:`,
        validate: (val) => (val.trim() ? true : `${envVar} is required`),
      });
      config.env![envVar] = value.trim();
    }
    console.log();
  }

  // Step 3: Detect apps and build selection list
  const allApps = detectApps();
  const detected = allApps.filter((app) => app.exists);
  const notDetectedProjectScoped = allApps.filter(
    (app) => !app.exists && app.scope === "project",
  );

  if (detected.length === 0 && notDetectedProjectScoped.length === 0) {
    console.log("No AI applications detected on this system.");
    console.log("You can manually copy the config from below:\n");
    printManualConfig(entry, config);
    return;
  }

  // Step 4: Select target apps
  // On first run (no saved preferences), detected apps are pre-checked and
  // project-scoped non-detected apps are unchecked.
  // On subsequent runs, the previously selected apps are pre-checked instead.
  const savedApps = getSavedSelectedApps();
  const hasSavedPreferences = savedApps !== null;

  const choices: (Separator | { name: string; value: DetectedApp; checked: boolean })[] = [
    ...detected.map((app) => ({
      name: app.name,
      value: app,
      checked: hasSavedPreferences ? savedApps.includes(app.id) : true,
    })),
  ];

  if (notDetectedProjectScoped.length > 0) {
    choices.push(new Separator("── Other supported apps ──"));
    choices.push(
      ...notDetectedProjectScoped.map((app) => ({
        name: app.name,
        value: app,
        checked: hasSavedPreferences ? savedApps.includes(app.id) : false,
      })),
    );
  }

  const selectedApps = await checkbox<DetectedApp>({
    message: "Select apps to configure:",
    choices,
    validate: (selected) =>
      selected.length > 0 ? true : "Select at least one app",
  });

  // Save selected apps for next run
  saveSelectedApps(selectedApps.map((app) => app.id));

  // Step 5+6: Generate and merge for each selected app
  for (const app of selectedApps) {
    try {
      const generator = getGenerator(app.id);
      const generatedConfig = generator.generate(entry.id, config);
      const merged = mergeServerIntoConfig(app.configPath, generatedConfig);
      writeConfigFile(app.configPath, merged);
      console.log(`  + ${app.name}: ${app.configPath}`);
    } catch (err) {
      console.error(
        `  ! ${app.name}: Failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  console.log(`\nDone! "${entry.name}" has been configured.`);

  // Reminder for apps that need restart
  const needsRestart = selectedApps.some((a) =>
    ["claude-desktop", "windsurf", "cursor"].includes(a.id),
  );
  if (needsRestart) {
    console.log("Note: Some apps may need to be restarted to pick up changes.");
  }

  // PyCharm-specific warning: plugin requirement + restart
  const hasPycharm = selectedApps.some((a) => a.id === "pycharm");
  if (hasPycharm) {
    console.log(
      "\nImportant: MCP servers in PyCharm require the JetBrains AI Assistant plugin:" +
      "\n  https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant" +
      "\n\nPyCharm must be closed and reopened for MCP configuration changes to take effect." +
      "\nThe new servers will not appear until you restart the IDE.",
    );
  }
}

function printManualConfig(
  entry: RegistryEntryType,
  config: LooseServerConfigType,
): void {
  // Show the canonical format
  const canonical = {
    mcpServers: {
      [entry.id]: config,
    },
  };
  console.log(JSON.stringify(canonical, null, 2));
}
