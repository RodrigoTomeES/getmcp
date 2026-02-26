"use client";

import { useState, useMemo } from "react";
import type { AppIdType, LooseServerConfigType } from "@getmcp/core";
import { generators } from "@getmcp/generators";
import { CodeBlock } from "@/components/CodeBlock";
import { Pill } from "./Pill";

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

  const generator = generators[selectedApp];
  const serialized = useMemo(() => {
    const generated = generator.generate(serverName, config);
    return generator.serialize(generated);
  }, [generator, serverName, config]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Configuration</h3>

      {/* App selector tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {APP_IDS.map((appId) => (
          <Pill key={appId} active={selectedApp === appId} onClick={() => setSelectedApp(appId)}>
            {APP_LABELS[appId]}
          </Pill>
        ))}
      </div>

      {/* Config path hint */}
      <p className="text-xs text-text-secondary mb-3">
        Config file:{" "}
        <code className="text-accent font-mono">
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
      <CodeBlock label={generator.app.configFormat.toUpperCase()}>{serialized}</CodeBlock>

      {/* Footer info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
        {/* Docs link */}
        <a
          href={generator.app.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          {APP_LABELS[selectedApp]} MCP documentation
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
