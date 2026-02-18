"use client";

import { useState } from "react";
import type { AppIdType, LooseServerConfigType } from "@getmcp/core";
import { generators } from "@getmcp/generators";

const APP_LABELS: Record<AppIdType, string> = {
  "claude-desktop": "Claude Desktop",
  "claude-code": "Claude Code",
  vscode: "VS Code / Copilot",
  cursor: "Cursor",
  cline: "Cline",
  "roo-code": "Roo Code",
  goose: "Goose",
  windsurf: "Windsurf",
  opencode: "OpenCode",
  zed: "Zed",
  pycharm: "PyCharm",
};

const APP_IDS = Object.keys(generators) as AppIdType[];

export function ConfigViewer({
  serverName,
  config,
}: {
  serverName: string;
  config: LooseServerConfigType;
}) {
  const [selectedApp, setSelectedApp] = useState<AppIdType>("claude-desktop");
  const [copied, setCopied] = useState(false);

  const generator = generators[selectedApp];
  const generated = generator.generate(serverName, config);
  const serialized = generator.serialize(generated);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serialized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement("textarea");
      textarea.value = serialized;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Configuration</h3>

      {/* App selector tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {APP_IDS.map((appId) => (
          <button
            key={appId}
            onClick={() => setSelectedApp(appId)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              selectedApp === appId
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {APP_LABELS[appId]}
          </button>
        ))}
      </div>

      {/* Config path hint */}
      <p className="text-xs text-[var(--color-text-secondary)] mb-2">
        Config file: <code className="text-[var(--color-accent)]">
          {generator.app.configPaths.darwin ??
            generator.app.configPaths.win32 ??
            generator.app.configPaths.linux ??
            "—"}
        </code>
      </p>

      {/* Code block */}
      <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {generator.app.configFormat.toUpperCase()}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-text-secondary)] transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code>{serialized}</code>
        </pre>
      </div>

      {/* PyCharm-specific warning */}
      {selectedApp === "pycharm" && (
        <p className="text-xs text-amber-500 mt-3">
          Requires the{" "}
          <a
            href="https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-400"
          >
            JetBrains AI Assistant
          </a>{" "}
          plugin. PyCharm must be closed and reopened for configuration changes to take effect.
        </p>
      )}

      {/* Docs link */}
      <p className="text-xs text-[var(--color-text-secondary)] mt-3">
        <a
          href={generator.app.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent)] hover:underline"
        >
          {APP_LABELS[selectedApp]} MCP documentation
        </a>
      </p>
    </div>
  );
}
