import { Terminal } from "lucide-react";

const COMMANDS = [
  { name: "add", description: "Install a server into your apps" },
  { name: "remove", description: "Uninstall from one or all apps" },
  { name: "list", description: "Browse available servers" },
  { name: "find", description: "Fuzzy search the registry" },
  { name: "check", description: "Validate tracked installations" },
  { name: "update", description: "Re-apply latest configs" },
  { name: "doctor", description: "Diagnose setup problems" },
  { name: "import", description: "Adopt existing server configs" },
  { name: "sync", description: "Install from project manifest" },
  { name: "registry", description: "Manage registry sources" },
];

export function CliShowcase() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-2">10 commands. Zero friction.</h2>
      <p className="text-text-secondary mb-8 max-w-2xl">
        From installing your first server to managing a team registry, the CLI handles it all.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: command cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMMANDS.map((cmd) => (
            <div key={cmd.name} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-accent font-mono text-sm font-medium">{cmd.name}</p>
              <p className="text-xs text-text-secondary mt-1">{cmd.description}</p>
            </div>
          ))}
        </div>

        {/* Right: terminal mock */}
        <div className="rounded-lg border border-border bg-code-bg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Terminal className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono text-text-secondary select-none">terminal</span>
          </div>
          <div className="px-4 py-3 font-mono text-sm leading-relaxed overflow-x-auto">
            <p>
              <span className="text-accent">$</span>{" "}
              <span className="text-text">getmcp doctor</span>
            </p>
            <p className="mt-2">
              <span className="text-success">✓</span>{" "}
              <span className="text-text-secondary">Claude Desktop — config valid</span>
            </p>
            <p>
              <span className="text-success">✓</span>{" "}
              <span className="text-text-secondary">VS Code — 3 servers installed</span>
            </p>
            <p>
              <span className="text-success">✓</span>{" "}
              <span className="text-text-secondary">Cursor — config valid</span>
            </p>
            <p>
              <span className="text-warning">!</span>{" "}
              <span className="text-text-secondary">Windsurf — not installed</span>
            </p>
            <p>
              <span className="text-success">✓</span>{" "}
              <span className="text-text-secondary">Lock file — 6 entries, all synced</span>
            </p>
            <p>
              <span className="text-success">✓</span>{" "}
              <span className="text-text-secondary">Registry — up to date</span>
            </p>
            <p className="mt-2 text-text-secondary">5 passed, 1 warning</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary text-center mt-6">
        Works with npx — no installation required.
      </p>
    </section>
  );
}
