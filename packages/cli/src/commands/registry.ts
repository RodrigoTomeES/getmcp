/**
 * `getmcp registry` command.
 *
 * Manages registry sources for MCP server discovery.
 *
 * Subcommands:
 *   add <url>        Add a registry source
 *   remove <name>    Remove a registry source
 *   list             List all configured registries
 *   login <name>     Authenticate to a private registry
 *   logout <name>    Remove stored credentials
 */

import * as p from "@clack/prompts";
import type { RegistryCredentialType } from "@getmcp/core";
import { addRegistry, removeRegistry, getAllRegistries } from "../registry-config.js";
import {
  storeCredential,
  removeCredential,
  resolveCredential,
  buildAuthHeaders,
} from "../credentials.js";
import { RegistryNotFoundError, RegistryReservedNameError, formatError } from "../errors.js";
import { exitIfCancelled } from "../utils.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Timeout for the registry ping check (ms) */
const PING_TIMEOUT_MS = 5_000;

/** Timeout for credential validation request (ms) */
const VALIDATION_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistryOptions {
  json?: boolean;
  name?: string;
  type?: string;
  method?: string;
}

// ---------------------------------------------------------------------------
// Name derivation
// ---------------------------------------------------------------------------

/**
 * Derive a registry name from a URL hostname.
 *
 * Extracts the second-level domain, lowercases it, and replaces dots with
 * hyphens so that "registry.example.com" becomes "example".
 *
 * @example
 * deriveRegistryName("https://registry.example.com") // "example"
 * deriveRegistryName("https://my.private.registry.io") // "registry"
 * deriveRegistryName("https://example.com") // "example"
 */
export function deriveRegistryName(url: string): string {
  const parsed = new URL(url);
  const parts = parsed.hostname.split(".");

  // For hostnames with 2+ parts (e.g. "example.com" or "registry.example.com"),
  // pick the second-to-last part — the registered domain label.
  const label = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return label.toLowerCase().replace(/\./g, "-");
}

// ---------------------------------------------------------------------------
// Ping helper
// ---------------------------------------------------------------------------

async function pingRegistry(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

    const response = await fetch(`${url.replace(/\/$/, "")}/v0.1/ping`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const body: unknown = await response.json();
    return (
      typeof body === "object" &&
      body !== null &&
      (body as Record<string, unknown>)["pong"] === true
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth credential test helper
// ---------------------------------------------------------------------------

async function testCredential(url: string, headers: Record<string, string>): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

    const response = await fetch(`${url.replace(/\/$/, "")}/v0.1/servers?limit=1`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return response.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Subcommand: add
// ---------------------------------------------------------------------------

async function addSubcommand(url: string | undefined, options: RegistryOptions): Promise<void> {
  p.intro("getmcp registry add");

  if (!url) {
    p.log.error("Usage: getmcp registry add <url> [--name <name>] [--type public|private]");
    process.exit(1);
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    p.log.error(`Invalid URL: "${url}"`);
    process.exit(1);
    return; // unreachable — satisfies TypeScript
  }

  // Normalise: strip trailing slash
  const normalised = url.replace(/\/$/, "");

  // Derive name from hostname if not provided
  const name = options.name ?? deriveRegistryName(parsedUrl.href);
  const type = (options.type === "private" ? "private" : "public") as "public" | "private";

  // Ping the registry
  const spinner = p.spinner();
  spinner.start(`Pinging ${normalised}…`);
  const reachable = await pingRegistry(normalised);
  if (reachable) {
    spinner.stop(`Registry responded successfully.`);
  } else {
    spinner.stop(`Registry did not respond to ping (continuing anyway).`);
    p.log.warn(
      `Could not reach ${normalised}/v0.1/ping. The registry may not support this endpoint.`,
    );
  }

  // Persist
  try {
    addRegistry({ name, url: normalised, type, priority: 100 });
  } catch (err) {
    p.log.error(formatError(err));
    process.exit(1);
  }

  p.log.success(`Registry "${name}" added (${normalised}).`);

  // Offer to log in for private registries
  if (type === "private") {
    const shouldLogin = await p.confirm({
      message: `Would you like to log in to "${name}" now?`,
      initialValue: true,
    });
    exitIfCancelled(shouldLogin);

    if (shouldLogin) {
      await loginSubcommand(name, options);
      return;
    }
  }

  p.outro(`Done. Use "getmcp registry login ${name}" to authenticate.`);
}

// ---------------------------------------------------------------------------
// Subcommand: remove
// ---------------------------------------------------------------------------

async function removeSubcommand(name: string | undefined): Promise<void> {
  p.intro("getmcp registry remove");

  if (!name) {
    p.log.error("Usage: getmcp registry remove <name>");
    process.exit(1);
  }

  if (name === "official") {
    throw new RegistryReservedNameError();
  }

  const removed = removeRegistry(name);
  if (!removed) {
    throw new RegistryNotFoundError(name);
  }

  // Clean up any stored credentials — ignore if none exist
  removeCredential(name);

  p.log.success(`Registry "${name}" has been removed.`);
  p.outro("Done");
}

// ---------------------------------------------------------------------------
// Subcommand: list
// ---------------------------------------------------------------------------

async function listSubcommand(options: RegistryOptions): Promise<void> {
  const registries = getAllRegistries();

  if (options.json) {
    const data = registries.map((reg) => ({
      name: reg.name,
      url: reg.url,
      type: reg.type,
      priority: reg.priority,
      authenticated: resolveCredential(reg.name) !== null,
    }));
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  p.intro(`Configured registries (${registries.length})`);

  for (const reg of registries) {
    const authenticated = resolveCredential(reg.name) !== null;
    const authStatus =
      reg.type === "private" ? (authenticated ? "authenticated" : "not authenticated") : "public";

    p.log.info(
      `${reg.name}\n` +
        `  URL:      ${reg.url}\n` +
        `  Type:     ${reg.type}\n` +
        `  Priority: ${reg.priority}\n` +
        `  Auth:     ${authStatus}`,
    );
  }

  p.outro("Done");
}

// ---------------------------------------------------------------------------
// Subcommand: login
// ---------------------------------------------------------------------------

async function loginSubcommand(name: string | undefined, options: RegistryOptions): Promise<void> {
  p.intro("getmcp registry login");

  if (!name) {
    p.log.error("Usage: getmcp registry login <name> [--method bearer|basic|header]");
    process.exit(1);
  }

  // Verify registry exists
  const registries = getAllRegistries();
  const registry = registries.find((r) => r.name === name);
  if (!registry) {
    throw new RegistryNotFoundError(name);
  }

  // Determine auth method
  let method = options.method as "bearer" | "basic" | "header" | undefined;

  if (!method || !["bearer", "basic", "header"].includes(method)) {
    const selected = await p.select({
      message: "Select authentication method:",
      options: [
        { value: "bearer", label: "Bearer token", hint: "Authorization: Bearer <token>" },
        { value: "basic", label: "Basic auth", hint: "Authorization: Basic <base64>" },
        { value: "header", label: "Custom header", hint: "X-Custom-Header: <value>" },
      ],
    });
    exitIfCancelled(selected);
    method = selected as "bearer" | "basic" | "header";
  }

  let credential: RegistryCredentialType;

  switch (method) {
    case "bearer": {
      const token = await p.password({ message: "Enter bearer token:" });
      exitIfCancelled(token);
      credential = { method: "bearer", token };
      break;
    }

    case "basic": {
      const username = await p.text({ message: "Enter username:" });
      exitIfCancelled(username);
      const password = await p.password({ message: "Enter password:" });
      exitIfCancelled(password);
      credential = { method: "basic", username, token: password };
      break;
    }

    case "header": {
      const headerName = await p.text({ message: "Enter header name:" });
      exitIfCancelled(headerName);
      const headerValue = await p.password({ message: "Enter header value:" });
      exitIfCancelled(headerValue);
      credential = { method: "header", headerName, token: headerValue };
      break;
    }

    default: {
      const _exhaustive: never = method;
      void _exhaustive;
      p.log.error(`Unknown auth method: "${String(method)}"`);
      process.exit(1);
      return; // unreachable
    }
  }

  // Test the credential
  const spinner = p.spinner();
  spinner.start("Testing credentials…");

  // Temporarily persist credential so buildAuthHeaders can resolve it
  storeCredential(name, credential);
  const headers = buildAuthHeaders(name);
  const ok = await testCredential(registry.url, headers);

  if (ok) {
    spinner.stop("Credentials verified successfully.");
  } else {
    spinner.stop(
      "Credential test failed (saving anyway — the endpoint may require specific paths).",
    );
    p.log.warn(
      `Could not verify credentials against ${registry.url}/v0.1/servers. ` +
        `They have been saved but may be incorrect.`,
    );
  }

  p.log.success(`Credentials for "${name}" stored.`);
  p.outro("Done");
}

// ---------------------------------------------------------------------------
// Subcommand: logout
// ---------------------------------------------------------------------------

async function logoutSubcommand(name: string | undefined): Promise<void> {
  p.intro("getmcp registry logout");

  if (!name) {
    p.log.error("Usage: getmcp registry logout <name>");
    process.exit(1);
  }

  const removed = removeCredential(name);
  if (!removed) {
    p.log.warn(`No credentials stored for "${name}".`);
  } else {
    p.log.success(`Credentials for "${name}" removed.`);
  }

  p.outro("Done");
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printRegistryHelp(): void {
  console.log(`
getmcp registry — Manage registry sources

Subcommands:
  add <url>        Add a registry source
  remove <name>    Remove a registry source
  list             List all configured registries
  login <name>     Authenticate to a private registry
  logout <name>    Remove stored credentials

Options:
  --name <name>    Name for the registry (for add; derived from hostname if omitted)
  --type <type>    Registry type: public or private (for add, default: public)
  --method <m>     Auth method: bearer, basic, or header (for login)
  --json           Output JSON (for list)

Examples:
  getmcp registry add https://registry.example.com
  getmcp registry add https://private.example.com --name private --type private
  getmcp registry list
  getmcp registry login private --method bearer
  getmcp registry logout private
  getmcp registry remove private
`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function registryCommand(
  subcommand?: string,
  args: string[] = [],
  options: RegistryOptions = {},
): Promise<void> {
  switch (subcommand) {
    case "add":
      await addSubcommand(args[0], options);
      break;

    case "remove":
      await removeSubcommand(args[0]);
      break;

    case "list":
      await listSubcommand(options);
      break;

    case "login":
      await loginSubcommand(args[0], options);
      break;

    case "logout":
      await logoutSubcommand(args[0]);
      break;

    default:
      printRegistryHelp();
      break;
  }
}
