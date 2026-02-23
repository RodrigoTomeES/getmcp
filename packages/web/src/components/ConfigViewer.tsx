"use client";

import { useState, useMemo } from "react";
import type { AppIdType, LooseServerConfigType } from "@getmcp/core";
import { generators } from "@getmcp/generators";
import { useClipboard } from "@/hooks/use-clipboard";

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
  codex: "Codex",
  "gemini-cli": "Gemini CLI",
  continue: "Continue",
  "amazon-q": "Amazon Q",
  trae: "Trae",
  "vscode-insiders": "VS Code Insiders",
  "bolt-ai": "BoltAI",
  "libre-chat": "LibreChat",
  antigravity: "Antigravity",
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
  const { copied, copy } = useClipboard();

  const generator = generators[selectedApp];
  const serialized = useMemo(() => {
    const generated = generator.generate(serverName, config);
    return generator.serialize(generated);
  }, [generator, serverName, config]);

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
                ? "border-accent bg-accent text-white"
                : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
            }`}
          >
            {APP_LABELS[appId]}
          </button>
        ))}
      </div>

      {/* Config path hint */}
      <p className="text-xs text-text-secondary mb-2">
        Config file:{" "}
        <code className="text-accent">
          {generator.app.configPaths !== null && generator.app.globalConfigPaths !== null
            ? `${generator.app.configPaths} (project) or ${generator.app.globalConfigPaths?.darwin ?? "—"} (global)`
            : (generator.app.configPaths ??
              generator.app.globalConfigPaths?.darwin ??
              generator.app.globalConfigPaths?.win32 ??
              generator.app.globalConfigPaths?.linux ??
              "—")}
        </code>
      </p>

      {/* Code block */}
      <div className="relative rounded-lg border border-border bg-code-bg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-xs text-text-secondary">
            {generator.app.configFormat.toUpperCase()}
          </span>
          <button
            onClick={() => copy(serialized)}
            className="text-text-secondary hover:text-text transition-colors shrink-0 p-1"
            aria-label="Copy configuration"
          >
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-success"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code>{serialized}</code>
        </pre>
      </div>

      {/* PyCharm-specific warning */}
      {selectedApp === "pycharm" && (
        <p className="text-xs text-warning mt-3">
          Requires the{" "}
          <a
            href="https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-warning-light"
          >
            JetBrains AI Assistant
          </a>{" "}
          plugin. PyCharm must be closed and reopened for configuration changes to take effect.
        </p>
      )}

      {/* Docs link */}
      <p className="text-xs text-text-secondary mt-3">
        <a
          href={generator.app.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {APP_LABELS[selectedApp]} MCP documentation
        </a>
      </p>
    </div>
  );
}
