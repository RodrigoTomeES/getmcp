/**
 * `getmcp init` command.
 *
 * Interactive wizard to scaffold a new MCP server registry entry.
 * Prompts for metadata and generates the TypeScript file.
 */

import * as p from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";

export async function initCommand(): Promise<void> {
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

  if (p.isCancel(id)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const name = await p.text({
    message: "Display name:",
    placeholder: "My MCP Server",
    validate: (val) => {
      if (!val || !val.trim()) return "Name is required";
    },
  });

  if (p.isCancel(name)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const description = await p.text({
    message: "Description:",
    placeholder: "What does this server do?",
    validate: (val) => {
      if (!val || !val.trim()) return "Description is required";
    },
  });

  if (p.isCancel(description)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

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

  if (p.isCancel(transport)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let configBlock: string;
  let envVarNames: string[] = [];

  if (transport === "stdio") {
    const command = await p.text({
      message: "Command:",
      placeholder: "npx",
      validate: (val) => {
        if (!val || !val.trim()) return "Command is required";
      },
    });

    if (p.isCancel(command)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    const argsRaw = await p.text({
      message: "Arguments (space-separated):",
      placeholder: "-y @modelcontextprotocol/server-github",
    });

    if (p.isCancel(argsRaw)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    const args = argsRaw.trim() ? argsRaw.trim().split(/\s+/) : [];

    const envRaw = await p.text({
      message: "Required env vars (comma-separated, or empty):",
      placeholder: "GITHUB_TOKEN, API_KEY",
    });

    if (p.isCancel(envRaw)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    envVarNames = envRaw.trim()
      ? envRaw
          .trim()
          .split(/\s*,\s*/)
          .filter(Boolean)
      : [];

    const envObj =
      envVarNames.length > 0
        ? `\n      env: {\n${envVarNames.map((v) => `        ${v}: "",`).join("\n")}\n      },`
        : "";

    const argsStr =
      args.length > 0 ? `\n      args: [${args.map((a) => `"${a}"`).join(", ")}],` : "";

    configBlock = `    config: {
      command: "${command}",${argsStr}${envObj}
    },`;
  } else {
    const url = await p.text({
      message: "Server URL:",
      placeholder: "https://example.com/mcp",
      validate: (val) => {
        if (!val || !val.trim()) return "URL is required";
        try {
          new URL(val);
        } catch {
          return "Must be a valid URL";
        }
      },
    });

    if (p.isCancel(url)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    configBlock = `    config: {
      url: "${url}",
      transport: "${transport}",
    },`;
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

  if (p.isCancel(categories)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

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

    if (p.isCancel(runtimeChoice)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    runtime = runtimeChoice;
  }

  // Optional metadata
  const repository = await p.text({
    message: "Repository URL (optional):",
    placeholder: "https://github.com/user/repo",
  });

  if (p.isCancel(repository)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const author = await p.text({
    message: "Author (optional):",
    placeholder: "Author Name",
  });

  if (p.isCancel(author)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Generate the TypeScript file
  const categoriesArr = categories as string[];
  const categoriesStr =
    categoriesArr.length > 0
      ? `\n    categories: [${categoriesArr.map((c) => `"${c}"`).join(", ")}],`
      : "";
  const runtimeStr = runtime ? `\n    runtime: "${runtime}",` : "";
  const repoStr = repository.trim() ? `\n    repository: "${repository.trim()}",` : "";
  const authorStr = author.trim() ? `\n    author: "${author.trim()}",` : "";
  const envVarsStr =
    envVarNames.length > 0
      ? `\n    requiredEnvVars: [${envVarNames.map((v) => `"${v}"`).join(", ")}],`
      : "";

  const fileContent = `import type { RegistryEntryType } from "@getmcp/core";

const server: RegistryEntryType = {
    id: "${id}",
    name: "${name}",
    description: "${description}",
${configBlock}${categoriesStr}${runtimeStr}${repoStr}${authorStr}${envVarsStr}
};

export default server;
`;

  // Determine output path
  const registryDir = path.resolve("packages/registry/src/servers");
  const outputPath = path.join(registryDir, `${id}.ts`);

  if (fs.existsSync(outputPath)) {
    p.log.warn(`File already exists: ${outputPath}`);
    const overwrite = await p.confirm({
      message: "Overwrite?",
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  // Show preview
  p.note(fileContent, `${id}.ts`);

  const confirmed = await p.confirm({
    message: "Create this file?",
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Write file
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, fileContent, "utf-8");

  p.log.success(`Created: ${outputPath}`);
  p.log.info(
    "Next steps:\n" +
      `  1. Import and register in packages/registry/src/index.ts\n` +
      `  2. Add a test in packages/registry/tests/registry.test.ts\n` +
      `  3. Run: npx vitest packages/registry`,
  );

  p.outro("Server entry scaffolded successfully.");
}
