/**
 * `getmcp init` command.
 *
 * Interactive wizard to scaffold a new MCP server registry entry.
 * Prompts for metadata and generates a JSON file.
 */

import * as p from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import { exitIfCancelled } from "../utils.js";

function validateUrl(val: string): string | undefined {
  try {
    new URL(val);
  } catch {
    return "Must be a valid URL";
  }
}

export interface InitOptions {
  output?: string;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  p.intro("getmcp init — Scaffold a new MCP server entry");

  // Basic metadata
  const id = await p.text({
    message: "Server ID (lowercase, hyphens only):",
    placeholder: "my-mcp-server",
    validate: (val) => {
      if (!val || !val.trim()) return "ID is required";
      if (!/^[a-z0-9-]+$/.test(val)) return "Must be lowercase alphanumeric with hyphens";
    },
  });

  exitIfCancelled(id);

  const name = await p.text({
    message: "Display name:",
    placeholder: "My MCP Server",
    validate: (val) => {
      if (!val || !val.trim()) return "Name is required";
    },
  });

  exitIfCancelled(name);

  const description = await p.text({
    message: "Description:",
    placeholder: "What does this server do?",
    validate: (val) => {
      if (!val || !val.trim()) return "Description is required";
    },
  });

  exitIfCancelled(description);

  // Transport type
  const transport = await p.select({
    message: "Transport type:",
    options: [
      { label: "stdio", hint: "Local process (npx, uvx, docker, etc.)", value: "stdio" as const },
      { label: "http", hint: "Remote HTTP server", value: "http" as const },
      {
        label: "streamable-http",
        hint: "Remote streamable HTTP",
        value: "streamable-http" as const,
      },
      { label: "sse", hint: "Server-Sent Events", value: "sse" as const },
    ],
  });

  exitIfCancelled(transport);

  let config: Record<string, unknown>;
  let envVarNames: string[] = [];

  if (transport === "stdio") {
    const command = await p.text({
      message: "Command:",
      placeholder: "npx",
      validate: (val) => {
        if (!val || !val.trim()) return "Command is required";
      },
    });

    exitIfCancelled(command);

    const argsRaw = await p.text({
      message: "Arguments (space-separated):",
      placeholder: "-y @modelcontextprotocol/server-github",
    });

    exitIfCancelled(argsRaw);

    const args = argsRaw.trim() ? argsRaw.trim().split(/\s+/) : [];

    const envRaw = await p.text({
      message: "Required env vars (comma-separated, or empty):",
      placeholder: "GITHUB_TOKEN, API_KEY",
    });

    exitIfCancelled(envRaw);

    envVarNames = envRaw.trim()
      ? envRaw
          .trim()
          .split(/\s*,\s*/)
          .filter(Boolean)
      : [];

    config = { command: command as string, transport: "stdio" as const };
    if (args.length > 0) config.args = args;
    if (envVarNames.length > 0) {
      config.env = Object.fromEntries(envVarNames.map((v) => [v, ""]));
    }
  } else {
    const url = await p.text({
      message: "Server URL:",
      placeholder: "https://example.com/mcp",
      validate: (val) => {
        if (!val || !val.trim()) return "URL is required";
        return validateUrl(val);
      },
    });

    exitIfCancelled(url);

    config = { url: url as string, transport };
  }

  // Categories
  const categories = await p.multiselect({
    message: "Categories:",
    options: [
      { label: "developer-tools", value: "developer-tools" },
      { label: "web", value: "web" },
      { label: "automation", value: "automation" },
      { label: "data", value: "data" },
      { label: "search", value: "search" },
      { label: "ai", value: "ai" },
      { label: "cloud", value: "cloud" },
      { label: "communication", value: "communication" },
      { label: "design", value: "design" },
      { label: "documentation", value: "documentation" },
      { label: "devops", value: "devops" },
      { label: "utilities", value: "utilities" },
      { label: "security", value: "security" },
      { label: "gaming", value: "gaming" },
    ],
    required: false,
  });

  exitIfCancelled(categories);

  // Runtime (for stdio)
  let runtime: string | undefined;
  if (transport === "stdio") {
    const runtimeChoice = await p.select({
      message: "Runtime:",
      options: [
        { label: "node", value: "node" },
        { label: "python", value: "python" },
        { label: "docker", value: "docker" },
        { label: "binary", value: "binary" },
      ],
    });

    exitIfCancelled(runtimeChoice);
    runtime = runtimeChoice;
  }

  // Optional metadata
  const repository = await p.text({
    message: "Repository URL (optional):",
    placeholder: "https://github.com/user/repo",
    validate: (val) => {
      if (val && val.trim()) return validateUrl(val.trim());
    },
  });

  exitIfCancelled(repository);

  const homepage = await p.text({
    message: "Homepage URL (optional):",
    placeholder: "https://github.com/user/repo",
    validate: (val) => {
      if (val && val.trim()) return validateUrl(val.trim());
    },
  });

  exitIfCancelled(homepage);

  const author = await p.text({
    message: "Author (optional):",
    placeholder: "Author Name",
  });

  exitIfCancelled(author);

  // Build the JSON object
  const categoriesArr = categories as string[];
  const entry: Record<string, unknown> = {
    $schema: "https://installmcp.dev/registry-entry.schema.json",
    id,
    name,
    description,
    config,
  };
  if (runtime) entry.runtime = runtime;
  if (repository.trim()) entry.repository = repository.trim();
  if (homepage.trim()) entry.homepage = homepage.trim();
  if (author.trim()) entry.author = author.trim();
  if (categoriesArr.length > 0) entry.categories = categoriesArr;
  if (envVarNames.length > 0) entry.requiredEnvVars = envVarNames;

  const fileContent = JSON.stringify(entry, null, 2) + "\n";

  // Determine output path
  const registryDir = options.output ? path.resolve(options.output) : path.resolve(".");
  const outputPath = path.join(registryDir, `${id}.json`);

  if (fs.existsSync(outputPath)) {
    p.log.warn(`File already exists: ${outputPath}`);
    const overwrite = await p.confirm({
      message: "Overwrite?",
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      exitIfCancelled(overwrite);
      p.cancel("Not overwriting.");
      process.exit(0);
    }
  }

  // Show preview
  p.note(fileContent, `${id}.json`);

  const confirmed = await p.confirm({
    message: "Create this file?",
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    exitIfCancelled(confirmed);
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Write file
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, fileContent, "utf-8");

  p.log.success(`Created: ${outputPath}`);

  p.outro("Server entry scaffolded successfully.");
}
