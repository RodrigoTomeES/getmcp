/**
 * CLI utility functions.
 */

import * as os from "node:os";
import * as path from "node:path";

/**
 * Check if the CLI is running in non-interactive mode.
 * Non-interactive when --yes is passed or stdin is not a TTY.
 */
export function isNonInteractive(opts: { yes?: boolean }): boolean {
  return !!opts.yes || !process.stdin.isTTY;
}

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
    return "." + normalized.slice(cwd.length).replace(/\\/g, "/");
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
  output?: string;
  global: boolean;
  project: boolean;
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
    global: false,
    project: false,
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
    } else if (arg === "--global" || arg === "-g") {
      flags.global = true;
    } else if (arg === "--project") {
      flags.project = true;
    } else if (arg === "--output" && i + 1 < argv.length) {
      i++;
      flags.output = argv[i];
    } else if (arg.startsWith("--output=")) {
      flags.output = arg.slice("--output=".length);
    } else if (arg === "-o" && i + 1 < argv.length) {
      i++;
      flags.output = argv[i];
    } else if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--version" || arg === "-v") {
      flags.version = true;
    } else if (arg.startsWith("-")) {
      // Unknown flag — warn the user
      const flagName = arg.split("=")[0];
      const similar = findSimilarFlag(flagName);
      if (similar) {
        console.warn(`Warning: Unknown flag "${flagName}". Did you mean "${similar}"?`);
      } else {
        console.warn(`Warning: Unknown flag "${flagName}". Run "getmcp --help" for usage.`);
      }
    } else {
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
  sync: "sync",
};

export function resolveAlias(command: string): string | undefined {
  return COMMAND_ALIASES[command];
}

/**
 * Exit if the user cancelled a @clack/prompts prompt.
 * Replaces the repeated `if (p.isCancel(val)) { p.cancel(...); process.exit(0); }` pattern.
 */
export function exitIfCancelled<T>(value: T | symbol): asserts value is T {
  // @clack/prompts returns a Symbol when the user cancels
  if (typeof value === "symbol") {
    // Dynamic import would be circular; use process.exit directly
    console.log("Cancelled.");
    process.exit(0);
  }
}

const KNOWN_FLAGS = [
  "--yes",
  "-y",
  "--app",
  "--all-apps",
  "--dry-run",
  "--installed",
  "--search",
  "--category",
  "--from-npm",
  "--from-pypi",
  "--from-url",
  "--json",
  "--quiet",
  "-q",
  "--global",
  "-g",
  "--project",
  "--output",
  "-o",
  "--help",
  "-h",
  "--version",
  "-v",
];

function findSimilarFlag(input: string): string | undefined {
  const name = input.replace(/^-+/, "").toLowerCase();
  let best: string | undefined;
  let bestDist = 3; // max edit distance threshold
  for (const flag of KNOWN_FLAGS) {
    if (!flag.startsWith("--")) continue;
    const candidate = flag.replace(/^-+/, "");
    const dist = levenshtein(name, candidate);
    if (dist < bestDist) {
      bestDist = dist;
      best = flag;
    }
  }
  return best;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
