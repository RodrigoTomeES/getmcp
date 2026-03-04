"use client";

import { useState, useCallback } from "react";
import { Terminal } from "lucide-react";

type TerminalLine = {
  text: string;
  color?: "accent" | "success" | "warning" | "secondary";
};

type Command = {
  name: string;
  description: string;
  terminal: { command: string; lines: TerminalLine[] };
};

const COMMANDS: Command[] = [
  {
    name: "add",
    description: "Install a server into your apps",
    terminal: {
      command: "getmcp add github",
      lines: [
        { text: "◆ GITHUB_PERSONAL_ACCESS_TOKEN:", color: "accent" },
        { text: "  Enter your token: ••••••••••••••••", color: "secondary" },
        { text: "" },
        { text: "◆ Select apps to install:", color: "accent" },
        { text: "  ◉ Claude Desktop", color: "success" },
        { text: "  ◉ VS Code", color: "success" },
        { text: "  ○ Cursor", color: "secondary" },
        { text: "" },
        { text: "✓ Config written → Claude Desktop", color: "success" },
        { text: "✓ Config written → VS Code", color: "success" },
        { text: "✓ Lock file updated — 1 server added", color: "success" },
      ],
    },
  },
  {
    name: "remove",
    description: "Uninstall from one or all apps",
    terminal: {
      command: "getmcp remove github-mcp-server",
      lines: [
        { text: "Found in 2 apps:", color: "secondary" },
        { text: "  • Claude Desktop", color: "secondary" },
        { text: "  • VS Code", color: "secondary" },
        { text: "" },
        { text: "◆ Remove from all apps?", color: "accent" },
        { text: "  Yes", color: "success" },
        { text: "" },
        { text: "✓ Removed from Claude Desktop", color: "success" },
        { text: "✓ Removed from VS Code", color: "success" },
        { text: "✓ Lock file updated — 1 server removed", color: "success" },
      ],
    },
  },
  {
    name: "list",
    description: "Browse available servers",
    terminal: {
      command: "getmcp list --category=developer-tools",
      lines: [
        { text: "Developer Tools — 47 servers", color: "accent" },
        { text: "" },
        { text: "  github", color: "success" },
        { text: "  GitHub API integration for repos, issues, PRs", color: "secondary" },
        { text: "  gitlab", color: "success" },
        { text: "  GitLab project management and CI/CD", color: "secondary" },
        { text: "  linear", color: "success" },
        { text: "  Linear issue tracking and project management", color: "secondary" },
        { text: "  sentry", color: "success" },
        { text: "  Error monitoring and performance tracking", color: "secondary" },
        { text: "" },
        { text: "Showing 4 of 47 — use --all to see more", color: "secondary" },
      ],
    },
  },
  {
    name: "find",
    description: "Fuzzy search the registry",
    terminal: {
      command: "getmcp find database",
      lines: [
        { text: '3 results for "database":', color: "accent" },
        { text: "" },
        { text: "  postgres-mcp", color: "success" },
        { text: "  PostgreSQL database queries and schema management", color: "secondary" },
        { text: "  sqlite", color: "success" },
        { text: "  Read and query SQLite databases", color: "secondary" },
        { text: "  neon", color: "success" },
        { text: "  Neon serverless Postgres management", color: "secondary" },
        { text: "" },
        { text: "Run getmcp add <name> to install", color: "secondary" },
      ],
    },
  },
  {
    name: "check",
    description: "Validate tracked installations",
    terminal: {
      command: "getmcp check",
      lines: [
        { text: "Checking 6 tracked installations…", color: "secondary" },
        { text: "" },
        { text: "✓ github — Claude Desktop, VS Code", color: "success" },
        { text: "✓ slack — Claude Desktop", color: "success" },
        { text: "✓ linear — Cursor", color: "success" },
        { text: "! puppeteer — config outdated in VS Code", color: "warning" },
        { text: "✓ postgres-mcp — Claude Desktop", color: "success" },
        { text: "✓ filesystem — Claude Desktop, Cursor", color: "success" },
        { text: "" },
        { text: "5 OK, 1 warning — run getmcp update to fix", color: "secondary" },
      ],
    },
  },
  {
    name: "update",
    description: "Re-apply latest configs",
    terminal: {
      command: "getmcp update",
      lines: [
        { text: "Checking for updates…", color: "secondary" },
        { text: "" },
        { text: "✓ puppeteer — updated in VS Code", color: "success" },
        { text: "  args changed: added --no-sandbox flag", color: "secondary" },
        { text: "✓ github — updated in Claude Desktop", color: "success" },
        { text: "  new env var: GITHUB_ENTERPRISE_URL (optional)", color: "secondary" },
        { text: "✓ slack — updated in Claude Desktop", color: "success" },
        { text: "  transport changed: stdio → sse", color: "secondary" },
        { text: "" },
        { text: "3 servers updated across 2 apps", color: "success" },
      ],
    },
  },
  {
    name: "doctor",
    description: "Diagnose setup problems",
    terminal: {
      command: "getmcp doctor",
      lines: [
        { text: "✓ Claude Desktop — config valid", color: "success" },
        { text: "✓ VS Code — 3 servers installed", color: "success" },
        { text: "✓ Cursor — config valid", color: "success" },
        { text: "! Windsurf — not installed", color: "warning" },
        { text: "✓ Lock file — 6 entries, all synced", color: "success" },
        { text: "✓ Registry — up to date", color: "success" },
        { text: "" },
        { text: "5 passed, 1 warning", color: "secondary" },
      ],
    },
  },
  {
    name: "import",
    description: "Adopt existing server configs",
    terminal: {
      command: "getmcp import",
      lines: [
        { text: "Scanning app configs…", color: "secondary" },
        { text: "" },
        { text: "Found 4 servers not in lock file:", color: "accent" },
        { text: "  ✓ github — matched to registry", color: "success" },
        { text: "  ✓ slack — matched to registry", color: "success" },
        { text: "  ✓ filesystem — matched to registry", color: "success" },
        { text: "  ! custom-api — no registry match, skipped", color: "warning" },
        { text: "" },
        { text: "3 servers imported into lock file", color: "success" },
      ],
    },
  },
  {
    name: "sync",
    description: "Install from project manifest",
    terminal: {
      command: "getmcp sync",
      lines: [
        { text: "Reading getmcp.json…", color: "secondary" },
        { text: "" },
        { text: "Syncing 3 servers to Claude Desktop:", color: "accent" },
        { text: "  ✓ github — installed", color: "success" },
        { text: "  ✓ linear — installed", color: "success" },
        { text: "  ✓ postgres-mcp — installed", color: "success" },
        { text: "" },
        { text: "◆ GITHUB_PERSONAL_ACCESS_TOKEN:", color: "accent" },
        { text: "  Using value from .env", color: "secondary" },
        { text: "" },
        { text: "All 3 servers synced", color: "success" },
      ],
    },
  },
  {
    name: "registry",
    description: "Manage registry sources",
    terminal: {
      command: "getmcp registry list",
      lines: [
        { text: "2 registries configured:", color: "accent" },
        { text: "" },
        { text: "  default", color: "success" },
        { text: "  https://registry.getmcp.com", color: "secondary" },
        { text: "  Auth: none — public", color: "secondary" },
        { text: "" },
        { text: "  acme-corp", color: "success" },
        { text: "  https://mcp.acme-corp.dev/registry", color: "secondary" },
        { text: "  Auth: bearer token ✓", color: "secondary" },
        { text: "" },
        { text: "Run getmcp registry add <url> to add more", color: "secondary" },
      ],
    },
  },
];

const COLOR_MAP: Record<string, string> = {
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  secondary: "text-text-secondary",
};

export function CliShowcase() {
  const [selected, setSelected] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const cols = 2;
      const total = COMMANDS.length;
      let next = selected;

      switch (e.key) {
        case "ArrowRight":
          next = selected + 1 < total ? selected + 1 : selected;
          break;
        case "ArrowLeft":
          next = selected - 1 >= 0 ? selected - 1 : selected;
          break;
        case "ArrowDown":
          next = selected + cols < total ? selected + cols : selected;
          break;
        case "ArrowUp":
          next = selected - cols >= 0 ? selected - cols : selected;
          break;
        default:
          return;
      }

      if (next !== selected) {
        e.preventDefault();
        setSelected(next);
      }
    },
    [selected],
  );

  const active = COMMANDS[selected];

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-2">10 commands. Zero friction.</h2>
      <p className="text-text-secondary mb-8 max-w-2xl">
        From installing your first server to managing a team registry, the CLI handles it all.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: command cards */}
        <div
          role="tablist"
          aria-label="CLI commands"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onKeyDown={handleKeyDown}
        >
          {COMMANDS.map((cmd, i) => (
            <button
              key={cmd.name}
              type="button"
              role="tab"
              aria-selected={i === selected}
              aria-controls="cli-terminal-panel"
              tabIndex={i === selected ? 0 : -1}
              onClick={() => setSelected(i)}
              className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                i === selected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent/50"
              }`}
            >
              <p className="text-accent font-mono text-sm font-medium">{cmd.name}</p>
              <p className="text-xs text-text-secondary mt-1">{cmd.description}</p>
            </button>
          ))}
        </div>

        {/* Right: terminal mock */}
        <div
          id="cli-terminal-panel"
          role="tabpanel"
          aria-label={`Terminal output for ${active.name} command`}
          className="rounded-lg border border-border bg-code-bg overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Terminal className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono text-text-secondary select-none">terminal</span>
          </div>
          <div className="px-4 py-3 font-mono text-sm leading-relaxed overflow-x-auto">
            <p>
              <span className="text-accent">$</span>{" "}
              <span className="text-text">{active.terminal.command}</span>
            </p>
            <div className="mt-2">
              {active.terminal.lines.map((line, i) => (
                <p
                  key={`${active.name}-${i}`}
                  className={line.color ? COLOR_MAP[line.color] : "text-text"}
                >
                  {line.text || "\u00A0"}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary text-center mt-6">
        Works with npx — no installation required.
      </p>
    </section>
  );
}
