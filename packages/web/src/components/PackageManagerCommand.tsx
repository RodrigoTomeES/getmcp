"use client";

import { useState, useEffect } from "react";

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const STORAGE_KEY = "getmcp-pm";
const DEFAULT_PM: PackageManager = "pnpm";

function getCommand(pm: PackageManager, serverId?: string): string {
  const id = serverId ?? "<server-id>";
  switch (pm) {
    case "pnpm":
      return `pnpm dlx @getmcp/cli add ${id}`;
    case "npm":
      return `npx @getmcp/cli add ${id}`;
    case "yarn":
      return `yarn dlx @getmcp/cli add ${id}`;
    case "bun":
      return `bunx @getmcp/cli add ${id}`;
  }
}

export function PackageManagerCommand({
  serverId,
}: {
  serverId?: string;
}) {
  const [selectedPm, setSelectedPm] = useState<PackageManager>(DEFAULT_PM);
  const [copied, setCopied] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && PACKAGE_MANAGERS.includes(stored as PackageManager)) {
        setSelectedPm(stored as PackageManager);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSelect = (pm: PackageManager) => {
    setSelectedPm(pm);
    try {
      localStorage.setItem(STORAGE_KEY, pm);
    } catch {
      // localStorage unavailable
    }
  };

  const command = getCommand(selectedPm, serverId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement("textarea");
      textarea.value = command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] overflow-hidden mb-8">
      {/* Header: terminal icon + tabs + copy button */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]">
        {/* Terminal icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" x2="20" y1="19" y2="19" />
        </svg>

        {/* Package manager tabs */}
        <div className="flex gap-1 flex-1">
          {PACKAGE_MANAGERS.map((pm) => (
            <button
              key={pm}
              onClick={() => handleSelect(pm)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                selectedPm === pm
                  ? "bg-[var(--color-surface)] text-[var(--color-text)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors shrink-0 p-1"
          aria-label="Copy command"
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
              className="w-4 h-4 text-[var(--color-success)]"
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

      {/* Command display */}
      <div className="px-4 py-3">
        <pre className="text-sm font-mono overflow-x-auto">
          <code>{command}</code>
        </pre>
      </div>
    </div>
  );
}
