import type { Metadata } from "next";
import Link from "next/link";
import { getAppIds } from "@getmcp/generators";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";

export const metadata: Metadata = {
  title: "Documentation \u2014 CLI Commands, Config Formats & API Reference",
  description:
    "Complete guide to getmcp: CLI installation, commands, project manifests, supported AI apps, library API, and contributing.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Documentation \u2014 CLI Commands, Config Formats & API Reference",
    description:
      "Complete guide to getmcp: CLI installation, commands, project manifests, supported AI apps, library API, and contributing.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation \u2014 CLI Commands, Config Formats & API Reference",
    description:
      "Complete guide to getmcp: CLI installation, commands, project manifests, supported AI apps, library API, and contributing.",
  },
  keywords: [
    "getmcp documentation",
    "MCP CLI commands",
    "MCP config format",
    "getmcp API",
    "MCP server installation",
    "getmcp guide",
  ],
};

export default function DocsPage() {
  const appCount = getAppIds().length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex gap-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "TechArticle",
              headline: "getmcp Documentation — CLI Commands, Config Formats & API Reference",
              description:
                "Complete guide to getmcp: CLI installation, commands, project manifests, supported AI apps, library API, and contributing.",
              url: "https://getmcp.es/docs",
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": "https://getmcp.es/docs",
              },
              author: { "@type": "Organization", name: "getmcp" },
              publisher: {
                "@type": "Organization",
                name: "getmcp",
                url: "https://getmcp.es",
              },
              inLanguage: "en",
              proficiencyLevel: "Beginner",
              dependencies: "Node.js 18+, npm",
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://getmcp.es",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Documentation",
                  item: "https://getmcp.es/docs",
                },
              ],
            },
          ]),
        }}
      />
      <DocsSidebar />
      <div className="min-w-0 max-w-3xl flex-1">
        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Documentation</h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
            Learn how to install, configure, and use getmcp to manage MCP servers across all AI
            applications.
          </p>
        </section>

        {/* What is getmcp? */}
        <section id="what-is-getmcp" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">What is getmcp?</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              Every AI application uses a different config format for MCP (Model Context Protocol)
              servers. Claude Desktop uses{" "}
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-sm font-mono text-text">
                mcpServers
              </code>
              , VS Code uses{" "}
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-sm font-mono text-text">
                servers
              </code>
              , Goose uses YAML with{" "}
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-sm font-mono text-text">
                cmd
              </code>
              /
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-sm font-mono text-text">
                envs
              </code>
              , Codex uses TOML with{" "}
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-sm font-mono text-text">
                mcp_servers
              </code>
              ... there are {appCount} apps, 6 root keys, and 4 formats.
            </p>
            <p>
              <span className="text-text font-medium">getmcp</span> solves this with one canonical
              format, config generators for every app, a registry of popular servers, and a CLI that
              auto-detects your apps and writes the correct config.
            </p>
          </div>
        </section>

        {/* Getting started */}
        <section id="getting-started" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">Getting started</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>Install any MCP server into all your detected AI apps with a single command:</p>
            <CodeBlock label="CLI">{`npx @getmcp/cli add <server>`}</CodeBlock>
            <p>Here are the most common CLI commands:</p>
            <CodeBlock label="CLI">{`# Install a server into all detected AI apps
npx @getmcp/cli add github

# Browse available servers
npx @getmcp/cli list

# Search for servers by keyword
npx @getmcp/cli list --search=database

# Interactive fuzzy search
npx @getmcp/cli find

# Remove a server from all apps
npx @getmcp/cli remove github

# Check installation status
npx @getmcp/cli check

# Update all tracked installations
npx @getmcp/cli update

# Diagnose config issues
npx @getmcp/cli doctor

# Adopt existing server configs into tracking
npx @getmcp/cli import

# Sync from project manifest (getmcp.json)
npx @getmcp/cli sync

# Machine-readable JSON output
npx @getmcp/cli list --json`}</CodeBlock>
            <p>
              The CLI auto-detects which AI applications you have installed, prompts for any
              required environment variables, and merges the config into each app{"'"}s config file.
              It never overwrites your existing configuration.
            </p>
          </div>
        </section>

        {/* Project manifests */}
        <section id="project-manifests" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">Project manifests</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              Teams can share MCP server configurations via a{" "}
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-sm font-mono text-text">
                getmcp.json
              </code>{" "}
              manifest file in the project root:
            </p>
            <CodeBlock label="JSON">{`{
  "servers": {
    "github": {},
    "postgres": {
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/mydb"
      }
    }
  }
}`}</CodeBlock>
            <p>
              Then any team member can install all declared servers into their detected apps with:
            </p>
            <CodeBlock label="CLI">{`npx @getmcp/cli sync`}</CodeBlock>
            <p>
              The sync command reads the manifest, resolves each server from the registry, merges
              any local overrides (like environment variables), and writes the correct config for
              every detected app.
            </p>
          </div>
        </section>

        {/* Supported apps */}
        <section id="supported-apps" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">Supported apps</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            getmcp generates config for {appCount} AI applications, each with its own format:
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-medium">App</th>
                  <th className="text-left px-4 py-3 font-medium">Root Key</th>
                  <th className="text-left px-4 py-3 font-medium">Format</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {[
                  ["Claude Desktop", "mcpServers", "JSON", "claude-desktop"],
                  ["Claude Code", "mcpServers", "JSON", "claude-code"],
                  ["VS Code / Copilot", "servers", "JSON", "vscode"],
                  ["Cursor", "mcpServers", "JSON", "cursor"],
                  ["Cline", "mcpServers", "JSON", "cline"],
                  ["Roo Code", "mcpServers", "JSON", "roo-code"],
                  ["Goose", "extensions", "YAML", "goose"],
                  ["Windsurf", "mcpServers", "JSON", "windsurf"],
                  ["OpenCode", "mcp", "JSONC", "opencode"],
                  ["Zed", "context_servers", "JSON", "zed"],
                  ["PyCharm", "mcpServers", "JSON", "pycharm"],
                  ["Codex", "mcp_servers", "TOML", "codex"],
                  ["Gemini CLI", "mcpServers", "JSON", "gemini-cli"],
                  ["Continue", "mcpServers", "JSON", "continue"],
                  ["Amazon Q", "mcpServers", "JSON", "amazon-q"],
                  ["Trae", "mcpServers", "JSON", "trae"],
                  ["BoltAI", "mcpServers", "JSON", "bolt-ai"],
                  ["LibreChat", "mcpServers", "YAML", "libre-chat"],
                  ["Antigravity", "mcpServers", "JSON", "antigravity"],
                ].map(([app, rootKey, format, guideSlug]) => (
                  <tr key={app} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5">
                      {app}
                      {guideSlug && (
                        <Link
                          href={`/guides/${guideSlug}`}
                          className="text-accent hover:underline ml-2 text-xs"
                        >
                          guide
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                        {rootKey}
                      </code>
                    </td>
                    <td className="px-4 py-2.5">{format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">How it works</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              Server definitions are stored in a{" "}
              <span className="text-text font-medium">canonical format</span> aligned with{" "}
              <a
                href="https://github.com/jlowin/fastmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                FastMCP
              </a>
              . Config generators transform this into each app{"'"}s native format — renaming
              fields, changing root keys, switching file formats.
            </p>
            <CodeBlock>{`Canonical Format (FastMCP-aligned)
        |
+-------+-------+-------+-------+
|       |       |       |       |
Claude  VS Code Goose  Codex  + ${appCount - 4} more
Desktop (servers)(YAML) (TOML)   apps`}</CodeBlock>
            <p>There are two types of server configs:</p>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>
                <span className="text-text font-medium">Stdio servers</span> — run a local process
                with{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  command
                </code>
                ,{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  args
                </code>
                , and{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  env
                </code>
              </li>
              <li>
                <span className="text-text font-medium">Remote servers</span> — connect to a URL
                with{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  url
                </code>{" "}
                and optional{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  transport
                </code>{" "}
                (
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  http
                </code>
                ,{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  streamable-http
                </code>
                , or{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  sse
                </code>
                )
              </li>
            </ul>
            <p>
              Transport is auto-inferred: URLs ending in{" "}
              <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                /sse
              </code>{" "}
              default to SSE, others default to HTTP.
            </p>
          </div>
        </section>

        {/* Library usage */}
        <section id="library-usage" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">Library usage</h2>
          <div className="space-y-6 text-text-secondary leading-relaxed">
            <p>
              All packages are available on npm and can be used programmatically in your own
              projects.
            </p>

            <div>
              <h3 id="generate-config" className="text-lg font-semibold text-text mb-3">
                Generate config for any app
              </h3>
              <CodeBlock label="TS">{`import { generateConfig, generateAllConfigs } from "@getmcp/generators";

// Generate for a specific app
const config = generateConfig("goose", "github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});
// => { extensions: { github: { cmd: "npx", args: [...], envs: {...} } } }

// Generate for ALL apps at once
const all = generateAllConfigs("github", {
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "ghp_xxx" },
});`}</CodeBlock>
            </div>

            <div>
              <h3 id="validate-schemas" className="text-lg font-semibold text-text mb-3">
                Validate configs with Zod schemas
              </h3>
              <CodeBlock label="TS">{`import { StdioServerConfig, CanonicalMCPConfig } from "@getmcp/core";

StdioServerConfig.parse({ command: "npx", args: ["server"] });
// throws ZodError if invalid`}</CodeBlock>
            </div>

            <div>
              <h3 id="search-registry" className="text-lg font-semibold text-text mb-3">
                Search the registry
              </h3>
              <CodeBlock label="TS">{`import { searchServers, getServersByCategory } from "@getmcp/registry";

searchServers("database");
// => [{ id: "postgres", ... }]

getServersByCategory("web");
// => [{ id: "brave-search", ... }, { id: "fetch", ... }]`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Adding a server */}
        <section id="adding-a-server" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-5">Adding a server to the registry</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>Want to add your MCP server to the getmcp registry? Here{"'"}s how:</p>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>
                Create a new JSON file at{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  packages/registry/servers/your-server.json
                </code>
              </li>
              <li>
                Add a{" "}
                <code className="bg-surface-hover px-1.5 py-0.5 rounded text-xs font-mono text-text">
                  $schema
                </code>{" "}
                field for IDE autocompletion
              </li>
              <li>Define your server{"'"}s metadata and config</li>
              <li>
                Run the tests to validate your entry (the registry auto-discovers all JSON files)
              </li>
            </ol>
            <p>Here{"'"}s an example registry entry:</p>
            <CodeBlock label="JSON">{`{
  "$schema": "https://getmcp.es/registry-entry.schema.json",
  "id": "my-server",
  "name": "My Server",
  "description": "What your server does",
  "categories": ["productivity"],
  "author": "your-name",
  "runtime": "node",
  "package": "@scope/my-mcp-server",
  "repository": "https://github.com/you/my-mcp-server",
  "requiredEnvVars": ["MY_API_KEY"],
  "config": {
    "command": "npx",
    "args": ["-y", "@scope/my-mcp-server"],
    "env": { "MY_API_KEY": "" }
  }
}`}</CodeBlock>
            <p>
              Once added, your server will automatically appear in the{" "}
              <Link href="/" className="text-accent hover:underline">
                web directory
              </Link>
              , CLI search, and all {appCount} config generators. Open a pull request on{" "}
              <a
                href="https://github.com/RodrigoTomeES/getmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                GitHub
              </a>{" "}
              to submit your server.
            </p>
          </div>
        </section>

        {/* Security */}
        <section id="security-disclaimer" className="scroll-mt-24">
          <div className="rounded-lg border border-warning-border bg-warning-subtle p-6">
            <h2 className="text-xl font-bold text-warning mb-3">Security disclaimer</h2>
            <div className="space-y-3 text-text-secondary leading-relaxed text-sm">
              <p>
                MCP servers in the getmcp registry are community-contributed. While we review
                submissions,{" "}
                <span className="text-text">
                  getmcp cannot guarantee the quality, security, or reliability
                </span>{" "}
                of any server.
              </p>
              <p>
                Before installing a server, review its source code and understand what permissions
                it requires. Stdio servers run local processes on your machine, and remote servers
                connect to third-party endpoints. Always use environment variables for sensitive
                credentials and never commit API keys to config files.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
