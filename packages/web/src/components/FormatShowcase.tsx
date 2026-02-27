export function FormatShowcase() {
  const formats = [
    {
      app: "Claude Desktop",
      format: "JSON",
      code: `{\n  "mcpServers": {\n    "github": { ... }\n  }\n}`,
    },
    {
      app: "VS Code",
      format: "JSON",
      code: `{\n  "servers": {\n    "github": { ... }\n  }\n}`,
    },
    {
      app: "Goose",
      format: "YAML",
      code: `extensions:\n  github:\n    cmd: npx\n    envs:\n      GITHUB_TOKEN: ...`,
    },
    {
      app: "Codex",
      format: "TOML",
      code: `[mcp_servers.github]\ncommand = "npx"\nargs = [...]`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {formats.map((f) => (
        <div key={f.app} className="rounded-lg border border-border bg-surface p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text truncate">{f.app}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary font-mono shrink-0">
              {f.format}
            </span>
          </div>
          <pre className="text-[11px] leading-relaxed text-text-secondary font-mono whitespace-pre overflow-hidden">
            {f.code}
          </pre>
        </div>
      ))}
    </div>
  );
}
