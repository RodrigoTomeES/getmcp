"use client";

import { useClipboard } from "@/hooks/use-clipboard";

export function CodeBlock({ children, label }: { children: string; label?: string }) {
  const { copied, copy } = useClipboard();

  return (
    <div className="rounded-lg border border-border bg-code-bg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-text-secondary font-medium">{label ?? "Code"}</span>
        <button
          onClick={() => copy(children)}
          className="text-text-secondary hover:text-text transition-colors shrink-0 p-1 rounded-md"
          aria-label={copied ? "Copied!" : "Copy code"}
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
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-text">
        <code>{children}</code>
      </pre>
    </div>
  );
}
