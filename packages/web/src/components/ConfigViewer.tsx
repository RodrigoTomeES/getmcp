"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { Pill } from "./Pill";

export type PreGeneratedConfig = {
  serialized: string;
  configPath: string;
  format: string;
  docsUrl: string;
};

const APP_LABELS: Record<string, string> = {
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
  "bolt-ai": "BoltAI",
  "libre-chat": "LibreChat",
  antigravity: "Antigravity",
};

export function ConfigViewer({ configs }: { configs: Record<string, PreGeneratedConfig> }) {
  const appIds = Object.keys(configs);
  const [selectedApp, setSelectedApp] = useState(appIds[0]);

  const current = configs[selectedApp];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Configuration</h3>

      {/* App selector tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="Select AI application">
        {appIds.map((appId) => (
          <Pill key={appId} active={selectedApp === appId} onClick={() => setSelectedApp(appId)}>
            {APP_LABELS[appId] ?? appId}
          </Pill>
        ))}
      </div>

      {/* Config path hint */}
      <p className="text-xs text-text-secondary mb-3">
        Config file: <code className="text-accent font-mono">{current.configPath}</code>
      </p>

      {/* Code block */}
      <CodeBlock label={current.format}>{current.serialized}</CodeBlock>

      {/* Footer info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
        {/* Docs link */}
        <a
          href={current.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          {APP_LABELS[selectedApp] ?? selectedApp} MCP documentation
          <span className="sr-only"> (opens in new tab)</span>
        </a>

        {/* PyCharm-specific warning */}
        {selectedApp === "pycharm" && (
          <p className="text-xs text-warning">
            Requires the{" "}
            <a
              href="https://plugins.jetbrains.com/plugin/22282-jetbrains-ai-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-warning-light"
            >
              JetBrains AI Assistant
            </a>{" "}
            plugin.
          </p>
        )}
      </div>
    </div>
  );
}
