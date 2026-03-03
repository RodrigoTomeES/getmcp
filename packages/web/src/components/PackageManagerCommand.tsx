"use client";

import { useSyncExternalStore } from "react";
import {
  PACKAGE_MANAGERS,
  type PackageManager,
  STORAGE_KEY,
  DEFAULT_PM,
  getCommand,
} from "@/lib/package-manager";
import { Terminal, Check, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";

const pmListeners = new Set<() => void>();

function subscribePm(callback: () => void) {
  pmListeners.add(callback);
  return () => {
    pmListeners.delete(callback);
  };
}

function getPmSnapshot(): PackageManager {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && PACKAGE_MANAGERS.includes(stored as PackageManager)) {
      return stored as PackageManager;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_PM;
}

function getPmServerSnapshot(): PackageManager {
  return DEFAULT_PM;
}

function setStoredPm(pm: PackageManager) {
  try {
    localStorage.setItem(STORAGE_KEY, pm);
  } catch {
    // localStorage unavailable
  }
  pmListeners.forEach((l) => l());
}

export function PackageManagerCommand({ serverId }: { serverId?: string }) {
  const selectedPm = useSyncExternalStore(subscribePm, getPmSnapshot, getPmServerSnapshot);
  const { copied, copy } = useClipboard();
  const command = getCommand(selectedPm, serverId);

  return (
    <div className="rounded-lg border border-border bg-code-bg overflow-hidden">
      {/* Header: terminal icon + tabs + copy button */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        {/* Terminal icon */}
        <Terminal className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />

        {/* Package manager tabs */}
        <div className="flex gap-1 flex-1" role="group" aria-label="Select package manager">
          {PACKAGE_MANAGERS.map((pm) => (
            <button
              key={pm}
              onClick={() => setStoredPm(pm)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                selectedPm === pm ? "bg-surface text-text" : "text-text-secondary hover:text-text"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <button
          onClick={() => copy(command)}
          className="text-text-secondary hover:text-text transition-colors shrink-0 p-1 rounded-md"
          aria-label="Copy command"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
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
