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
 *
 * Supports non-interactive mode via --yes, --app, --all-apps flags.
 * Supports --dry-run to preview changes without writing.
 */

import * as p from "@clack/prompts";
import {
  getAllServers,
  getServer,
  searchServers,
} from "@getmcp/registry";
import { getGenerator, getAppIds } from "@getmcp/generators";
import { isStdioConfig } from "@getmcp/core";
import type { LooseServerConfigType, RegistryEntryType, AppIdType } from "@getmcp/core";
import { detectApps, type DetectedApp } from "../detect.js";
import { mergeServerIntoConfig, writeConfigFile } from "../config-file.js";
import { getSavedSelectedApps, saveSelectedApps } from "../preferences.js";
import { trackInstallation } from "../lock.js";
import { shortenPath } from "../utils.js";
import {
  ServerNotFoundError,
  AppNotDetectedError,
  InvalidAppError,
  NonInteractiveError,
  formatError,
} from "../errors.js";

export interface AddOptions {
  yes?: boolean;
  apps?: string[];
  allApps?: boolean;
  dryRun?: boolean;
}

export async function addCommand(
  serverIdArg?: string,
  options: AddOptions = {},
): Promise<void> {
  const isNonInteractive = options.yes || !process.stdin.isTTY;

  p.intro("getmcp add");

  // Step 1: Select server
  let entry: RegistryEntryType;

  if (serverIdArg) {
    const found = getServer(serverIdArg);
    if (!found) {
      // Try fuzzy search
      const matches = searchServers(serverIdArg);
      if (matches.length === 0) {
        p.log.error(new ServerNotFoundError(serverIdArg).format());
        process.exit(1);
      }
      if (matches.length === 1) {
        entry = matches[0];
      } else if (isNonInteractive) {
        // In non-interactive mode, take first match
        entry = matches[0];
        p.log.info(`Multiple matches for "${serverIdArg}", using: ${matches[0].name}`);
      } else {
        const selected = await p.select({
          message: `Multiple matches for "${serverIdArg}". Pick one:`,
          options: matches.map((s) => ({
            label: s.name,
            hint: s.description,
            value: s,
          })),
        });

        if (p.isCancel(selected)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        entry = selected;
      }
    } else {
      entry = found;
    }
  } else if (isNonInteractive) {
    p.log.error(
      new NonInteractiveError("server ID is required in non-interactive mode").format(),
    );
    process.exit(1);
  } else {
    const servers = getAllServers();
    const selected = await p.select({
      message: "Select an MCP server to install:",
      options: servers.map((s) => ({
        label: s.name,
        hint: s.description,
        value: s,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    entry = selected;
  }

  p.log.info(`Installing: ${entry.name}\n  ${entry.description}`);

  // Step 2: Prompt for required environment variables
  const config = structuredClone(entry.config) as LooseServerConfigType;

  if (entry.requiredEnvVars.length > 0 && isStdioConfig(config)) {
    if (isNonInteractive) {
      // In non-interactive mode, check if env vars are already set in the environment
      let allSet = true;
      for (const envVar of entry.requiredEnvVars) {
        const envValue = process.env[envVar];
        if (envValue) {
          config.env![envVar] = envValue;
        } else {
          allSet = false;
          p.log.warn(`Required env var ${envVar} is not set in environment`);
        }
      }
      if (!allSet) {
        p.log.warn(
          "Some required environment variables are missing. The server may not work correctly.\n  Set them in your shell environment and re-run, or run interactively to be prompted.",
        );
      }
    } else {
      p.log.step("This server requires environment variables:");
      for (const envVar of entry.requiredEnvVars) {
        const isSensitive = SENSITIVE_PATTERNS.test(envVar);
        const promptFn = isSensitive ? p.password : p.text;
        const value = await promptFn({
          message: `${envVar}:`,
          validate: (val) => {
            if (!val || !val.trim()) return `${envVar} is required`;
          },
        });

        if (p.isCancel(value)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        config.env![envVar] = (value as string).trim();
      }
    }
  }

  // Step 3: Detect apps and build selection list
  const allApps = detectApps();
  const detected = allApps.filter((app) => app.exists);
  const notDetectedProjectScoped = allApps.filter(
    (app) => !app.exists && app.scope === "project",
  );

  // Step 4: Select target apps
  let selectedApps: DetectedApp[];

  if (options.allApps) {
    // --all-apps: use all detected apps
    selectedApps = detected;
    if (selectedApps.length === 0) {
      p.log.error(new AppNotDetectedError().format());
      printManualConfig(entry, config);
      p.outro("Done");
      return;
    }
  } else if (options.apps && options.apps.length > 0) {
    // --app <id>: use specified apps
    const validIds = getAppIds();
    selectedApps = [];

    for (const appId of options.apps) {
      if (!validIds.includes(appId as AppIdType)) {
        p.log.error(new InvalidAppError(appId, validIds).format());
        process.exit(1);
      }

      const app = allApps.find((a) => a.id === appId);
      if (app) {
        selectedApps.push(app);
      } else {
        p.log.warn(`App "${appId}" has no config path for this platform. Skipping.`);
      }
    }

    if (selectedApps.length === 0) {
      p.log.error("None of the specified apps are available on this platform.");
      process.exit(1);
    }
  } else if (isNonInteractive) {
    // Non-interactive without --app: use all detected
    selectedApps = detected;
    if (selectedApps.length === 0) {
      p.log.error(new AppNotDetectedError().format());
      printManualConfig(entry, config);
      p.outro("Done");
      return;
    }
  } else {
    // Interactive mode
    if (detected.length === 0 && notDetectedProjectScoped.length === 0) {
      p.log.warn("No AI applications detected on this system.\n  You can manually copy the config from below:");
      printManualConfig(entry, config);
      p.outro("Done");
      return;
    }

    const savedApps = getSavedSelectedApps();
    const hasSavedPreferences = savedApps !== null;

    const choices = [
      ...detected.map((app) => ({
        label: app.name,
        value: app,
        hint: shortenPath(app.configPath),
      })),
      ...notDetectedProjectScoped.map((app) => ({
        label: app.name,
        value: app,
        hint: `${shortenPath(app.configPath)} (not detected)`,
      })),
    ];

    const initialValues = choices
      .filter((c) =>
        hasSavedPreferences
          ? savedApps.includes(c.value.id)
          : c.value.exists,
      )
      .map((c) => c.value);

    const selected = await p.multiselect({
      message: "Select apps to configure:",
      options: choices,
      initialValues,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    selectedApps = selected;

    // Save selected apps for next run
    saveSelectedApps(selectedApps.map((app) => app.id));
  }

  // Step 5+6: Generate and merge for each selected app
  if (options.dryRun) {
    p.log.step("Dry run — showing what would be written:\n");
  }

  const spin = p.spinner();
  spin.start(`Configuring ${selectedApps.length} app(s)...`);

  const results: { app: DetectedApp; ok: boolean; error?: string }[] = [];

  for (const app of selectedApps) {
    try {
      const generator = getGenerator(app.id);
      const generatedConfig = generator.generate(entry.id, config);

      if (options.dryRun) {
        spin.stop(`Preview for ${app.name}:`);
        const serialized = generator.serialize(generatedConfig);
        p.note(
          `File: ${shortenPath(app.configPath)}\n\n${serialized}`,
          app.name,
        );
        spin.start("Continuing...");
        results.push({ app, ok: true });
      } else {
        const merged = mergeServerIntoConfig(app.configPath, generatedConfig);
        writeConfigFile(app.configPath, merged);
        results.push({ app, ok: true });
      }
    } catch (err) {
      results.push({
        app,
        ok: false,
        error: formatError(err),
      });
    }
  }

  spin.stop("Configuration complete.");

  // Show results summary
  for (const r of results) {
    if (r.ok) {
      p.log.success(`${r.app.name}: ${shortenPath(r.app.configPath)}`);
    } else {
      p.log.error(`${r.app.name}: ${r.error}`);
    }
  }

  // Track installation (unless dry-run)
  if (!options.dryRun) {
    const successApps = results.filter((r) => r.ok).map((r) => r.app.id);
    if (successApps.length > 0) {
      trackInstallation(entry.id, successApps, entry.requiredEnvVars);
    }
  }

  const action = options.dryRun ? "would be configured" : "has been configured";
  p.outro(`"${entry.name}" ${action}.`);

  // Reminder for apps that need restart
  const needsRestart = selectedApps.some((a) =>
    ["claude-desktop", "windsurf", "cursor"].includes(a.id),
  );
  if (needsRestart && !options.dryRun) {
    p.log.info("Some apps may need to be restarted to pick up changes.");
  }

  // PyCharm-specific warning
  const hasPycharm = selectedApps.some((a) => a.id === "pycharm");
  if (hasPycharm && !options.dryRun) {
    p.log.warn(
      "MCP servers in PyCharm require the JetBrains AI Assistant plugin:\n" +
      "  https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant\n\n" +
      "  PyCharm must be closed and reopened for changes to take effect.",
    );
  }
}

function printManualConfig(
  entry: RegistryEntryType,
  config: LooseServerConfigType,
): void {
  const canonical = {
    mcpServers: {
      [entry.id]: config,
    },
  };
  p.note(JSON.stringify(canonical, null, 2), "Canonical config");
}

/**
 * Heuristic to detect if an environment variable name likely holds a secret.
 */
const SENSITIVE_PATTERNS =
  /TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL|AUTH|PAT|PRIVATE/i;
