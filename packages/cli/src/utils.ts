/**
 * CLI utility functions.
 */

import * as os from "node:os";
import * as path from "node:path";

/**
 * Shorten a file path for display by replacing the home directory with `~`
 * and the current working directory with `.`.
 */
export function shortenPath(filePath: string): string {
  const normalized = path.normalize(filePath);
  const cwd = process.cwd();
  const home = os.homedir();

  // Replace CWD first (more specific), then HOME
  if (normalized.startsWith(cwd + path.sep) || normalized === cwd) {
    return "." + normalized.slice(cwd.length);
  }

  if (normalized.startsWith(home + path.sep) || normalized === home) {
    return "~" + normalized.slice(home.length).replace(/\\/g, "/");
  }

  return normalized;
}

/**
 * Parse CLI flags from argv.
 * Returns structured options and remaining positional args.
 */
export interface CliFlags {
  yes: boolean;
  apps: string[];
  allApps: boolean;
  dryRun: boolean;
  installed: boolean;
  search?: string;
  category?: string;
  json: boolean;
  quiet: boolean;
  fromNpm?: string;
  fromPypi?: string;
  fromUrl?: string;
  help: boolean;
  version: boolean;
}

export function parseFlags(argv: string[]): {
  command?: string;
  serverId?: string;
  flags: CliFlags;
} {
  const flags: CliFlags = {
    yes: false,
    apps: [],
    allApps: false,
    dryRun: false,
    installed: false,
    json: false,
    quiet: false,
    help: false,
    version: false,
  };

  let command: string | undefined;
  let serverId: string | undefined;
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--yes" || arg === "-y") {
      flags.yes = true;
    } else if (arg === "--app" && i + 1 < argv.length) {
      i++;
      flags.apps.push(argv[i]);
    } else if (arg.startsWith("--app=")) {
      flags.apps.push(arg.slice("--app=".length));
    } else if (arg === "--all-apps") {
      flags.allApps = true;
    } else if (arg === "--dry-run") {
      flags.dryRun = true;
    } else if (arg === "--installed") {
      flags.installed = true;
    } else if (arg.startsWith("--search=")) {
      flags.search = arg.slice("--search=".length);
    } else if (arg.startsWith("--category=")) {
      flags.category = arg.slice("--category=".length);
    } else if (arg.startsWith("--from-npm=")) {
      flags.fromNpm = arg.slice("--from-npm=".length);
    } else if (arg === "--from-npm" && i + 1 < argv.length) {
      i++;
      flags.fromNpm = argv[i];
    } else if (arg.startsWith("--from-pypi=")) {
      flags.fromPypi = arg.slice("--from-pypi=".length);
    } else if (arg === "--from-pypi" && i + 1 < argv.length) {
      i++;
      flags.fromPypi = argv[i];
    } else if (arg.startsWith("--from-url=")) {
      flags.fromUrl = arg.slice("--from-url=".length);
    } else if (arg === "--from-url" && i + 1 < argv.length) {
      i++;
      flags.fromUrl = argv[i];
    } else if (arg === "--json") {
      flags.json = true;
    } else if (arg === "--quiet" || arg === "-q") {
      flags.quiet = true;
    } else if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--version" || arg === "-v") {
      flags.version = true;
    } else if (!arg.startsWith("-")) {
      positionals.push(arg);
    }
  }

  command = positionals[0];
  serverId = positionals[1];

  return { command, serverId, flags };
}

/**
 * Resolve command aliases to canonical command names.
 */
const COMMAND_ALIASES: Record<string, string> = {
  add: "add",
  install: "add",
  i: "add",
  remove: "remove",
  rm: "remove",
  r: "remove",
  uninstall: "remove",
  list: "list",
  ls: "list",
  find: "find",
  search: "find",
  s: "find",
  f: "find",
  check: "check",
  update: "update",
  init: "init",
  doctor: "doctor",
  dr: "doctor",
  import: "import",
};

export function resolveAlias(command: string): string | undefined {
  return COMMAND_ALIASES[command];
}
