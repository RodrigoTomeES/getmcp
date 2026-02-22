/**
 * `getmcp doctor` command.
 *
 * Runs health diagnostics on MCP server configurations:
 * 1. Detect installed apps and report status
 * 2. Parse each app's config file (detect syntax errors)
 * 3. Check if configured servers are in the registry
 * 4. Check for orphaned servers (in config but not in lock)
 * 5. Verify required env vars are set
 * 6. Check for duplicate server entries across apps
 * 7. Verify runtime dependencies (node, npx, uvx)
 */

import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { getServer } from "@getmcp/registry";
import { detectInstalledApps } from "../detect.js";
import { readConfigFile, listServersInConfig } from "../config-file.js";
import { getTrackedServers } from "../lock.js";

export interface DoctorOptions {
  json?: boolean;
}

interface DiagnosticResult {
  category: string;
  status: "ok" | "warn" | "error";
  message: string;
  details?: string;
}

export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  const results: DiagnosticResult[] = [];

  // 1. Detect apps
  const apps = detectInstalledApps();
  results.push({
    category: "apps",
    status: apps.length > 0 ? "ok" : "warn",
    message:
      apps.length > 0
        ? `${apps.length} AI application(s) detected`
        : "No AI applications detected on this system",
    details: apps.map((a) => a.name).join(", ") || undefined,
  });

  // 2. Parse config files
  for (const app of apps) {
    try {
      readConfigFile(app.configPath);
      results.push({
        category: "config-parse",
        status: "ok",
        message: `${app.name}: config file is valid`,
      });
    } catch (err) {
      results.push({
        category: "config-parse",
        status: "error",
        message: `${app.name}: config file has syntax errors`,
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 3-6. Check servers in configs
  const allConfiguredServers = new Map<string, string[]>();

  for (const app of apps) {
    let servers: string[] = [];
    try {
      servers = listServersInConfig(app.configPath);
    } catch {
      continue;
    }

    for (const serverId of servers) {
      const existing = allConfiguredServers.get(serverId) ?? [];
      existing.push(app.id);
      allConfiguredServers.set(serverId, existing);
    }
  }

  // Check registry status of configured servers
  const lock = getTrackedServers();
  for (const [serverId, appIds] of allConfiguredServers) {
    const registryEntry = getServer(serverId);
    const isTracked = serverId in lock.installations;

    if (!registryEntry && !isTracked) {
      results.push({
        category: "server-status",
        status: "warn",
        message: `"${serverId}" is not in the registry and not tracked`,
        details: `Configured in: ${appIds.join(", ")}`,
      });
    } else if (!registryEntry && isTracked) {
      results.push({
        category: "server-status",
        status: "warn",
        message: `"${serverId}" is tracked but no longer in registry`,
        details: `Configured in: ${appIds.join(", ")}`,
      });
    }

    // Check for orphaned servers (in config but not in lock)
    if (registryEntry && !isTracked) {
      results.push({
        category: "orphaned",
        status: "warn",
        message: `"${serverId}" is in config but not tracked in lock file`,
        details: `Configured in: ${appIds.join(", ")}. Run 'getmcp add ${serverId}' to track it.`,
      });
    }
  }

  // Check env vars for tracked servers
  for (const [serverId, installation] of Object.entries(lock.installations)) {
    if (installation.envVars.length === 0) continue;

    const missingVars = installation.envVars.filter((v) => !process.env[v]);
    if (missingVars.length > 0) {
      results.push({
        category: "env-vars",
        status: "warn",
        message: `"${serverId}" has unset env vars: ${missingVars.join(", ")}`,
        details:
          "These may be configured in app-specific config files rather than the shell environment.",
      });
    }
  }

  // Check for duplicate server entries (same server in multiple apps)
  for (const [serverId, appIds] of allConfiguredServers) {
    if (appIds.length > 1) {
      results.push({
        category: "duplicates",
        status: "ok",
        message: `"${serverId}" is configured in ${appIds.length} apps`,
        details: appIds.join(", "),
      });
    }
  }

  // 7. Check runtime dependencies
  checkRuntime("node", "--version", results);
  checkRuntime("npx", "--version", results);
  checkRuntime("uvx", "--version", results);

  // Output
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  p.intro("getmcp doctor");

  const errors = results.filter((r) => r.status === "error");
  const warnings = results.filter((r) => r.status === "warn");
  const oks = results.filter((r) => r.status === "ok");

  for (const r of errors) {
    p.log.error(`${r.message}${r.details ? `\n  ${r.details}` : ""}`);
  }
  for (const r of warnings) {
    p.log.warn(`${r.message}${r.details ? `\n  ${r.details}` : ""}`);
  }
  for (const r of oks) {
    p.log.success(r.message);
  }

  if (errors.length > 0) {
    p.outro(`${errors.length} error(s) and ${warnings.length} warning(s) found.`);
  } else if (warnings.length > 0) {
    p.outro(`${warnings.length} warning(s) found. ${oks.length} check(s) passed.`);
  } else {
    p.outro(`All ${oks.length} check(s) passed.`);
  }
}

function checkRuntime(command: string, versionFlag: string, results: DiagnosticResult[]): void {
  try {
    const version = execSync(`${command} ${versionFlag}`, {
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
    results.push({
      category: "runtime",
      status: "ok",
      message: `${command}: ${version}`,
    });
  } catch {
    results.push({
      category: "runtime",
      status: command === "uvx" ? "warn" : "warn",
      message: `${command}: not found`,
      details:
        command === "uvx"
          ? "Python-based MCP servers require uvx. Install with: pip install uv"
          : `${command} is required for stdio MCP servers`,
    });
  }
}
