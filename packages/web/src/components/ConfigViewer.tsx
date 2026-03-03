"use client";

import { useState, useEffect } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { Pill } from "./Pill";
import { APP_LABELS } from "@/lib/guide-data";

export type PreGeneratedConfig = {
  serialized: string;
  configPath: string;
  format: string;
  docsUrl: string;
};

export function ConfigViewer({ configs }: { configs: Record<string, PreGeneratedConfig> }) {
  const appIds = Object.keys(configs);
  const [selectedApp, setSelectedApp] = useState(appIds[0]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("getmcp-preferred-app");
      if (saved && configs[saved]) {
        setSelectedApp(saved);
      }
    } catch {
      // localStorage unavailable (private browsing, restrictive CSP)
    }
    // configs is stable per mount (pre-generated in server component)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectApp = (appId: string) => {
    setSelectedApp(appId);
    try {
      localStorage.setItem("getmcp-preferred-app", appId);
    } catch {
      // localStorage unavailable
    }
  };

  const current = configs[selectedApp];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Configuration</h3>

      {/* Mobile app selector */}
      <select
        className="select-custom md:hidden w-full mb-4 rounded-lg border border-border bg-surface text-text py-2.5 px-3 focus:outline-none focus:border-accent transition-colors"
        value={selectedApp}
        onChange={(e) => handleSelectApp(e.target.value)}
        aria-label="Select AI application"
      >
        {appIds.map((appId) => (
          <option key={appId} value={appId}>
            {APP_LABELS[appId] ?? appId}
          </option>
        ))}
      </select>

      {/* App selector tabs */}
      <div
        className="hidden md:flex flex-wrap gap-1.5 mb-5"
        role="tablist"
        aria-label="Select AI application"
      >
        {appIds.map((appId) => (
          <Pill
            key={appId}
            active={selectedApp === appId}
            onClick={() => handleSelectApp(appId)}
            role="tab"
            aria-controls="config-tabpanel"
            id={`config-tab-${appId}`}
          >
            {APP_LABELS[appId] ?? appId}
          </Pill>
        ))}
      </div>

      {/* Tab panel content */}
      <div role="tabpanel" id="config-tabpanel" aria-labelledby={`config-tab-${selectedApp}`}>
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
    </div>
  );
}
